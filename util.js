"use strict";

const fs = require("fs");
const crypto = require("crypto");

function mkdirIfNotExistsSync(directory) {
    try{
        fs.accessSync(directory);
    }
    catch(error){
        fs.mkdirSync(directory);
    }
}

function writeFileIfNotExistsSync(file, content){
    try{
        fs.accessSync(file);
    }
    catch(error){
        fs.writeFileSync(file, content, "utf8");
    }
}

function getHashOfData(data) {
    let hash = crypto.createHash("sha1");
    hash.update(data);
    return hash.digest("hex");
}

function getHashOfFile(file) {
    try{
        let data = fs.readFileSync(file, "utf8");
        return getHashOfData(data);
    }
    catch(error){
        console.error("getHashFromFile:", error);
    }
}

function getFileHashListFrom(file){
    let list = null;
    try{
        list = JSON.parse(fs.readFileSync(file));
    }
    catch(error){
        console.log("readFileHashListFrom:", error);
    }
    return list;
}

function writeFileHashListTo(file, list){
    try{
        fs.writeFileSync(file, JSON.stringify(list), "utf8");
    }
    catch(error){
        console.log("readFileHashListTo", error);
    }
}

module.exports = {
    "mkdirIfNotExistsSync": mkdirIfNotExistsSync,
    "writeFileIfNotExistsSync": writeFileIfNotExistsSync,
    "getHashOfData": getHashOfData,
    "getHashOfFile": getHashOfFile,
    "getFileHashListFrom": getFileHashListFrom,
    "writeFileHashListTo": writeFileHashListTo
}
