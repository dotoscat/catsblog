"use strict";

const path = require("path");
const fs = require("fs");
var program = require("commander");
const util = require( path.join(__dirname, "./util.js"));

program
    .arguments("<directory>")
    .action ((directory) => {
        init( path.resolve(directory) );
    })
    .parse(process.argv);
    
var basicConfigFile = `{
    "title": "catsblog",
    "postsPerPage": 2,
}
`;

function init(directory){
    util.mkdirIfNotExistsSync(directory);
    util.writeFileIfNotExistsSync(path.join(directory, "config.json"), JSON.stringify(basicConfigFile));
    console.log(directory);
    process.exit(0);
}

program.help();

/*
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
*/