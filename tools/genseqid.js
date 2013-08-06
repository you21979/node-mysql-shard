var fs = require("fs");
var FILENAME = "./seqid.ddl.tmpl";

var pre = function(p){
    if(process.argv.length < 3){
        throw new Error("ARGMENT ERROR input tablename");
    }
    p.tablename = process.argv[2];
}

var exec = function(p){
    p.output = fs.readFileSync(FILENAME, "utf-8")
                .replace("!!!DO NOT EXECUTE\n", "")
                .replace(/<TABLENAME>/g, p.tablename)
                ;
}

var post = function(p){
    console.log(p.output);
}

var main = function(){
    var param = {};
    pre(param);
    exec(param);
    post(param);
}

main();
