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
    try{
        fs.accessSync(base);
    }
    catch (error) {
        fs.mkdirSync(base);
    }
	siteStructure.forEach( (dir) => {
		let folder = path.join(base, dir);
		try{
			fs.accessSync(folder);
		}
		catch (error) {
			fs.mkdirSync(folder);
		}
		finalStructure[dir] = path.resolve(folder);
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
	<h1>{{articleTitle}}</h1>
	{{{content}}}
	<p>{{date}}</p>
	<ul id="tags">
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
		"articleTitle": postInfo.attributes.title,
		"date": postInfo.attributes.date,
		"tags": postTags
	}
	
	postInfo.body = mustache.render(template, view);
}

function renderTagList (tags) {
	let template = `
		<ul id="tags">
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

function writePost(postInfo, template, config){
    
    let view = {
        "article": postInfo.body,
        "arcticleTitle": postInfo.attributes.title,
        "title": config.title
    }
    
	let postOutput = mustache.render(template, view);
	fs.writeFileSync(postInfo.attributes.path, postOutput, "utf8");
}

function writeTagPage(tag, tagInfo, tagsListRendered, template, config){
	//console.log(tag)
	//console.log(tagList._rendered)
    
    let view = {
        "tag": tag,
        "posts": tagInfo.posts,
        "tagsList": tagsListRendered,
        "title": config.title
    }
    
	let pageContent = mustache.render(template, view);
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

function writePage (page, nPages, tagList, siteStructure, template, config) {
	let view = {
        title: config.title,
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

function copyFile(from, to){
    console.log("from", from);
    console.log("to", to);
    fs.createReadStream(from).pipe(fs.createWriteStream(to));
}

function generateSite(program) {
    //console.log("apply sort", postInfo);
    //console.log(config)
    //console.log(tags)
    let config = null;
    try{
        config = JSON.parse(fs.readFileSync( path.join(program.directory, "config.json") ) );
    }
    catch (error) {
        console.log(`There are problems with config.json on ${program.directory}`);
        process.exit(1);
    }
                            
    function getCorrectPath(directory, templateName, defaultTemplateName) {
        return typeof templateName === "string" ? path.join(directory, templateName) : path.join(__dirname, defaultTemplateName);
    }
                            
    let postTemplate = fs.readFileSync(getCorrectPath(program.directory, program.postTemplate, "postTemplate.html"), "utf8");  
    let tagsTemplate = fs.readFileSync(getCorrectPath(program.directory, program.tagsTemplate, "tagsPage.html"), "utf8");
    let pageTemplate = fs.readFileSync(getCorrectPath(program.directory, program.pageTemplate, "pageTemplate.html"), "utf8");
    
    config.source = path.join(program.directory, config.source) ;
    
    let postList = fs.readdirSync( config.source );
    postList.forEach ( (file) => { path.join( config.source, file ) });
    let postInfo = [];
    let tags = [];
    let renderedTagList = null;
    let pages = null;

    let siteStructure = createSiteStructure( path.join(program.directory, config.output), [
		"posts",
		"tags",
		"pages"
	]);

    console.log(siteStructure)

    //process.exit(0)
    
    for (let i = 0; i < postList.length; i++){
        let aPostInfo = getPostInfo(postList[i], siteStructure, config);
        postInfo.push( aPostInfo );
        addTagsFromPostInfo(tags, aPostInfo, siteStructure, config);
    }
    console.log(postInfo);
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
    console.log(renderedTagList)

    pages = generatePages(postInfo, config.postsPerPage, siteStructure);
    console.log(pages)

    var tagsKeys = Object.keys(tags);

    for (let i = 0; i < tagsKeys.length; i++){
        let key = tagsKeys[i];
        if (key[0] === '_')continue;
        writeTagPage(key, tags[key], renderedTagList, tagsTemplate, config);
    }

    for (let i = 0; i < postInfo.length; i++){
        writePost(postInfo[i], postTemplate, config);
    }

    for (let i = 0; i < pages.length; i++){
        writePage(pages[i], pages.length, renderedTagList, siteStructure, pageTemplate, config);
    }
    console.log(config);
    copyFile( path.join(program.directory, config.style), path.join(siteStructure.root, config.style) );
}

function init(output){
    
    output = typeof output === "undefined" ? "" : output;
    
    let basicConfig = `{
"title": "catsblog",
"source": "posts",
"output": "output",
"postsPerPage": 2,
"style": "style.css"
}
`;

    let configFile = path.join(output, "config.json");
    let style = path.join(output, "style.css");
    
    try{
        fs.accessSync(output);
    }
    catch(error){
        fs.mkdirSync(output);
    }
    try{
        fs.accessSync(configFile);
    }
    catch(error){
        fs.writeFileSync(configFile, JSON.stringify(basicConfig), "utf8");
    }
    try{
        fs.accessSync(style);
    }
    catch(error){
        fs.writeFileSync(style, "", "utf8");
    }
}

const version = "0.1.0";

function showHelp(){
    console.log(`
        catsblog ${version}
        Usage:
            catsblog init|create <site directory>
            catsblog [-g | --generate] publish <site directory>
            catsblog [-p | --publish] generate <site directory>
            catsblog Show this help

            -g --generate   Generate site
            -p --publish    Publish the site
            -h --help       Show this help
    `);
}

let program = {};

program.showHelp = process.argv.length < 3;
program.directory = "";
program.generate = false;
program.publish = false;
program.init = false;
program.subcommand = "";

const subcommands = /^init$|^create$|^publish$|^generate$/;

for (let i = 2; i < process.argv.length; i++){
    let parameter = process.argv[i];
    program.showHelp = parameter.search(/-h$|--help$/) > -1 ? true : program.showHelp;
    program.publish = parameter.search(/-p$|--publish$|^publish$/) > -1 ? true : program.publish;
    program.generate = parameter.search(/-g$|--generate$|^generate$/) > -1 ? true : program.generate;
    program.subcommand = program.subcommand === "" && parameter.search(subcommands) > -1 ? parameter : program.subcommand;
    program.directory = program.subcommand !== "" && parameter.search(subcommands) === -1 && i === process.argv.length-1 ? path.resolve(parameter) : program.directory;
    //console.log(i, program);
}

program.showHelp = program.directory === "" ? true : program.showHelp;
program.generate = program.subcommand === "generate" ? true : program.generate;
program.publish = program.publish === "publish" ? true : program.publish;

if (program.showHelp){
    showHelp();
    process.exit(1);
};

if (program.subcommand === "init"){
    init(program.directory);
    process.exit(0);
}

if (program.generate){
    generateSite(program);
    console.log("generate");
}
if (program.publish){
    console.log("publish");
}
//generateSite(program);
