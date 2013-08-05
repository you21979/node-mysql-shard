"use strict";
var mysql = require('mysql');
var heartbeats = require('./heartbeats');
var asyncTask = require('./async_task_complete');

var event = exports.event = {
    onPingResponse : function(conn, latency){},
    onConnect : function(conn, latency){},
};

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
            event.onPingResponse(conn, resp);
        });
    });
};

/**
 *  connection pool initializer
 */
var setup = exports.setup = function(config, callback){
    var pool = mysql.createPool(config);
    var task = asyncTask();
    var lists = [];

    for(var i=0; i<config.connectionLimit; ++i){
        // test max connection
        task.enter();
        var t = process.uptime();
        pool.getConnection(function(err, conn) {
            var resp = process.uptime() - t;
            if(err){
                console.log("Error Config:" + JSON.stringify(config));
                throw err;
            }
            connection_init(conn);
            lists.push(conn);
            event.onConnect(conn, resp);
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
