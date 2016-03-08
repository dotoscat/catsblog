"use strict";

const path = require("path");
const fs = require("fs");
var program = require("commander");
const util = require( path.join(__dirname, "./util.js"));

var basicConfigFile = `{
    "title": "catsblog",
    "postsPerPage": 2,
}
`;

program
    .arguments("<directory>")
    .action ((directory) => {
        init( path.resolve(directory) );
    })
    .parse(process.argv);

function init(directory){
    util.mkdirIfNotExistsSync(directory);
    util.writeFileIfNotExistsSync(path.join(directory, "config.json"), basicConfigFile);
    let hash = util.getHashOfData(basicConfigFile);
    let fileHashList = {"config.json": hash};
    util.writeFileHashListTo(path.join(directory, ".filechecksum"), fileHashList);
    console.log(directory);
    process.exit(0);
}

program.help();
