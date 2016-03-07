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
