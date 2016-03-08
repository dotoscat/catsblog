"use strict";

const path = require("path");
const fs = require("fs");
const util = require( path.join(__dirname, "./util.js"));

function listPosts(){
  let postDirectory = path.join(process.cwd(), "posts");
  let postList = fs.readdirSync(postDirectory);
  let list = util.getFileHashListFrom(".filechecksum");
  postList.forEach((postName) => {
    let postPath = path.join(postDirectory, postName);
    let sum = util.getHashOfFile(postPath);
    let output = postName.replace(/-/g, "\ ");
    output += sum === list[postName] ? "" : "\tm"
    console.log(output);
  });
}

listPosts();
