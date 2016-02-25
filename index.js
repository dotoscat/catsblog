#!/usr/bin/env	node

"use strict";
const fs = require("fs");
const path = require("path");
const mustache = require("mustache");
const markdown = require("markdown");
const jfm = require("json-front-matter");

function createSiteStructure(base, siteStructure) {
	let finalStructure = {};
    base = path.resolve(base);
	siteStructure.forEach( (dir) => {
		let folder = path.join(base, dir);
		try{
			fs.accessSync(folder);
		}
		catch (error) {
			fs.mkdirSync(folder);
		}
		finalStructure[dir] = folder;
	});
	finalStructure.root = base;
	return finalStructure;
}

function getPostInfo(post, siteStructure, config) {
	let postPath = path.join( config.source, post);
	let postContent = fs.readFileSync( postPath, "utf8" );
	let postData = jfm.parse(postContent);
	postData.attributes.path = path.join(siteStructure.posts, path.basename(postPath, ".md") + ".html").replace(/\ /g, "-");
	postData.attributes.url = postData.attributes.path.replace(siteStructure.root, "").replace(/\\/g, "/");
	return postData;
}

function addTagsFromPostInfo (tags, post, siteStructure, config) {
	let postInfoTags = post.attributes.tags;
	for(let i = 0; i < postInfoTags.length; i++){
		let tag = postInfoTags[i];
		if (!(tag in tags)) {
			let tagPath = path.join(siteStructure.tags, tag + ".html").replace(/\ /g, "-");
			tags[tag] = {
			"tag": tag,
			"path": tagPath,//clean tags url
			"url": tagPath.replace(siteStructure.root, "").replace(/\\/g, "/"),
			"posts": []
			}
		};
		if (tags[tag].posts.find( (tagPost) => tagPost.title === post.attributes.title ? true : false) ) continue;
		tags[tag].posts.push({"title":post.attributes.title, "url":post.attributes.url });
	}
	
}

function renderPost(postInfo, tags) {
	let template = `
	<article>
	<h1>{{title}}</h1>
	{{{content}}}
	<p>{{date}}</p>
	<ul>
	{{#tags}}
		<li><a href=\"{{{url}}}\">{{tag}}</a></li>
	{{/tags}}
	</ul>
	</article>
	`
	let markdownRendered = markdown.markdown.toHTML(postInfo.body);
	let postTags = [];
	for (let i = 0; i < postInfo.attributes.tags.length; i++){
		let tag = postInfo.attributes.tags[i];
		let copy = {"tag": tag, "url": tags[tag].url};
		postTags.push(copy);
	}
		
	let view = {
		"content": markdownRendered,
		"title": postInfo.attributes.title,
		"date": postInfo.attributes.date,
		"tags": postTags
	}
	
	postInfo.body = mustache.render(template, view);
}

function renderTagList (tags) {
	let template = `
		<ul>
		{{#tags}}
			<li><a href=\"{{{url}}}\">{{tag}}</a></li>
		{{/tags}}
		</ul>
	`
	
	let tagList = [];
	let keys = Object.keys(tags);
	for (let i = 0; i < keys.length; i++){
		tagList.push(tags[keys[i]]);
	}
	return mustache.render(template, {"tags": tagList});
}

function writePost(postInfo, template){
	let postOutput = mustache.render(template, {"article": postInfo.body, "title": postInfo.attributes.title});
	fs.writeFileSync(postInfo.attributes.path, postOutput, "utf8");
}

function writeTagPage(tag, tagInfo, tagsListRendered, template){
	//console.log(tag)
	//console.log(tagList._rendered)
	let pageContent = mustache.render(template, {"tag": tag, "posts": tagInfo.posts, "tagsList": tagsListRendered});
	//console.log(pageContent)
	fs.writeFileSync(tagInfo.path, pageContent, "utf8");
}

function generatePages (posts, postsPerPage, siteStructure) {
	let pages = [];
	
	function createPage (path, url, idPage) {
		return {
			id: idPage,
			posts: [],
			url: url,
			path: path,
		}
	}
	
	let page = createPage(path.join(siteStructure.root, "index.html"), "/index.html", 0);
	for (let i = 0, currentPosts = 0, iPage = 0; i < posts.length; i += 1){
		page.posts.push (posts[i]);
		currentPosts++;
		if (i === posts.length-1){
			pages.push(page);
            iPage++;
		}
		else if (currentPosts === postsPerPage) {
			currentPosts = 0;
			pages.push (page);
            iPage++;
			let pagePath = path.join(siteStructure.pages, `page${iPage}.html`);
			page = createPage(pagePath, pagePath.replace(siteStructure.root, "").replace(/\\/g, "/"), iPage);
		}
	}
	return pages;
}

function writePage (page, nPages, tagList, siteStructure, template) {
	let view = {
		posts: page.posts,
		tagList: tagList,
		previous: () => {
			if (page.id > 0){
				let pageName = page.id-1 === 0 ? "/index.html" : "page"+(page.id-1)+".html" ;
				let url = pageName === "/index.html" ? "/index.html" :
				path.join(siteStructure.pages, pageName).replace(siteStructure.root, "").replace(/\\/g, "/");
				return "<p><a href=\'"+url+"\'>previous</a></p>";
			}
			return "";
		},
		next: () => {
            if (page.id + 1 !== nPages){
				let pageName = "page"+(page.id+1)+".html" ;
				let url = path.join(siteStructure.pages, pageName).replace(siteStructure.root, "").replace(/\\/g, "/");
				return "<p><a href=\'"+url+"\'>next</a></p>";
			}
			return "";
		}
	}
	
	let pageContent = mustache.render(template, view);
	//console.log(pageContent);
	fs.writeFileSync(page.path, pageContent);
}

function generateSite() {
    //console.log("apply sort", postInfo);
    //console.log(config)
    //console.log(tags)
    let config = JSON.parse(fs.readFileSync("config.json"));
    let postTemplate = fs.readFileSync(config.postTemplate, "utf8");
    let tagsTemplate = fs.readFileSync(config.tagTemplate, "utf8");
    let pageTemplate = fs.readFileSync(config.pageTemplate, "utf8");

    console.log(__dirname)

    let postList = fs.readdirSync(config.source);
    let postInfo = [];
    let tags = [];
    let renderedTagList = null;
    let pages = null;

    let siteStructure = createSiteStructure(config.output, [
		"posts",
		"tags",
		"pages"
	]);

    //console.log(siteStructure)

    for (let i = 0; i < postList.length; i++){
        let aPostInfo = getPostInfo(postList[i], siteStructure, config);
        postInfo.push( aPostInfo );
        addTagsFromPostInfo(tags, aPostInfo, siteStructure, config);
    }
    //console.log(postInfo);
    postInfo.sort ( (postA, postB) => {
        let postADate = new Date(postA.attributes.date);
        let postBDate = new Date(postB.attributes.date);
        return postADate > postBDate ? -1 : 1 ;
    });
    
    console.log(postList);
    for (let i = 0; i < postInfo.length; i++){
        renderPost(postInfo[i], tags);
    }

    renderedTagList = renderTagList(tags);
    //console.log(renderedTagList)

    pages = generatePages(postInfo, config.postsPerPage, siteStructure);
    //console.log(pages)

    var tagsKeys = Object.keys(tags);

    for (let i = 0; i < tagsKeys.length; i++){
        let key = tagsKeys[i];
        if (key[0] === '_')continue;
        writeTagPage(key, tags[key], renderedTagList, tagsTemplate);
    }

    for (let i = 0; i < postInfo.length; i++){
        writePost(postInfo[i], postTemplate);
    }

    for (let i = 0; i < pages.length; i++){
        writePage(pages[i], pages.length, renderedTagList, siteStructure, pageTemplate);
    }
}

const version = "0.1.0";

function showHelp(){
    console.log(`
        catsblog ${version}
        Usage:
            catsblog [-h, --help] [-p, --publish] <site directory>
            -h --help Show this help
            -p --publish Publish the site directory
    `);
}

let program = {};

program.showHelp = process.argv.length < 3;

for (let i = 2; i < process.argv.length; i++){
    let parameter = process.argv[i];
    program.showHelp = parameter.search(/-h$|--help$/) > -1 ? true : program.showHelp;
    program.publish = parameter.search(/-p$|--publish$/) > -1 ? true : false;
    program.directory = i === process.argv.length-1 ? path.resolve(parameter) : ""; 
}

if (program.showHelp){
    showHelp();
    process.exit(1);
};

try{
    if (!fs.statSync(program.directory).isDirectory()){
        console.log("Plase enter a valid site directory");
        process.exit(1);
    }
}
catch (error){
    console.log(error);
    console.log("Plase enter a valid site directory");
    process.exit(1);
}

console.log("Working with", program.directory);
let directoryFiles = fs.readdirSync(program.directory);
console.log(directoryFiles);

process.exit(0);
