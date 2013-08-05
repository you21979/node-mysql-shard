"use strict";
var mysql = require('mysql');
var heartbeats = require('./heartbeats');
var asyncTask = require('./async_task_complete');


/**
 *  initialize mysql event
 */
var connection_init = function(conn){
    conn.on("error", function(e){
        throw e;
    });
    heartbeats.push(function(){
        var t = process.uptime();
        conn.ping(function(){
            var resp = process.uptime() - t;
        });
    });
};

/**
 *  connection pool initializer
 */
var setup = module.exports = function(config, callback){
    var pool = mysql.createPool(config);
    var task = asyncTask();
    var lists = [];

    for(var i=0; i<config.connectionLimit; ++i){
        // test max connection
        task.enter();
        pool.getConnection(function(err, conn) {
            if(err){
                console.log("Error Config:" + JSON.stringify(config));
                throw err;
            }
            connection_init(conn);
            lists.push(conn);
            task.leave();
        });
    }
    task.join(function(){
        lists.forEach(function(_c){
            _c.end();
        });
        lists.length = 0;
        callback();
    });
    return pool;
};
