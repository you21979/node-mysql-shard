"use strict";
var mysql = require('mysql');
var heartbeats = require('./heartbeats');

var connection_init = function(conn){
    conn.on("error", function(e){
        throw e;
    });
    heartbeats.push(function(){
        var t = process.uptime();
        conn.ping(function(){
            var resp = process.uptime() - t;
console.log(resp);
        });
    });
};

var setup = module.exports = function(config, callback){
    var pool  = mysql.createPool(config);

    var lists = [];
    var complete = function(){
        lists.forEach(function(_c){
            _c.end();
        });
        lists.length = 0;
        callback();
    };

    for(var i=0; i<config.connectionLimit; ++i){
        pool.getConnection(function(err, conn) {
            if(err){
                console.log("Error Config:" + JSON.stringify(config));
                throw err;
            }
            connection_init(conn);
            lists.push(conn);
            if(lists.length === config.connectionLimit){
                complete();
            }
        });
    }
    return pool;
};
