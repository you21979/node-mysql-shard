"use strict";
var fs = require('fs');

var readFileJSON = function(filename){
    return JSON.parse(fs.readFileSync(filename, 'utf-8'));
}

var readAuth = exports.readAuth = function( filename ){
    var cfg = readFileJSON(filename);
    if( "auth" in cfg
     && "user" in cfg.auth
     && "password" in cfg.auth
    ){
        return cfg;
    }
    throw new Error("read error");
}

var createMysqlConfig = exports.createMysqlConfig = function(host, port, database, user, password, limit){
    return {
        host : host,
        port : port,
        database : database,
        user : user,
        password : password,
        connectionLimit : limit,
        debug : false,
    };
}

