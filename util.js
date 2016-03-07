const fs = require("fs");

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

module.exports = {
    "mkdirIfNotExistsSync": mkdirIfNotExistsSync,
    "writeFileIfNotExistsSync": writeFileIfNotExistsSync;
}
