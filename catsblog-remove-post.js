"use strict";

const fs = require("fs");
const path = require("path");
var program = require("commander");
const util = require(path.join(__dirname, "util.js"));

program
  .arguments("<postname>")
  .action(removePost)
  .parse(process.argv);

function removePost(postName){
  postName = postName.search(/.md$/i) === -1 ? postName + ".md" : postName;
  postName = postName.replace(/\ /g, "-");
  let postPath = path.join( process.cwd(), "posts", postName );
  try{
    fs.accessSync(postPath);
    fs.unlinkSync(postPath);
    let list = util.getFileHashListFrom(".filechecksum");
    delete list[postName];
    util.writeFileHashListTo(".filechecksum", list);
    process.exit(0);
  }
  catch(error){
    console.error("Error deleting %s", postName);
    process.exit(1);
  }
}

program.help();
