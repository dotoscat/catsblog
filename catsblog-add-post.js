"use strict"

const fs = require("fs");
const path = require("path");
var program = require("commander");
const util = require( path.join(__dirname, "./util.js") );

program
    .arguments("<postname>")
    .action((postName) => {
        createPost(postName);
    })
    .parse(process.argv);

function createPost(postName) {
    util.mkdirIfNotExistsSync("posts");
    const postsPath = path.join( process.cwd(), "posts");
    const postFile = postName.replace(/\ /g,"-")+".md";
    const postPath = path.join(postsPath, postFile);

    let date = new Date();

    const content =
`{{{
    "date": "${date.toLocaleString()}",
    "tags": [],
    "title": "${postName}"
}}}

Write here with markdown!
`;
let hash = util.getHashOfData(content);
    try{
      fs.accessSync(postPath);
    }
    catch(error){
      fs.writeFileSync(postPath, content, "utf8");
      let list = util.getFileHashListFrom(".filechecksum");
      list[postFile] = hash;
      util.writeFileHashListTo(".filechecksum", list);
    }
    console.log(postPath);
    process.exit(0);
}

program.help();
