"use strict";
var mysql = require('mysql');
var heartbeats = require('./heartbeats');
var async = require('async');

/**
 *  event list
 */
var event = exports.event = {
    onPingResponse : function(pool, conn, latency){},
    onPreConnectSuccess : function(pool, conn, latency){},
    onPreConnectError : function(pool, err, latency){
        throw err;
    },
    onError : function(pool, conn, err){
        throw err;
    }
};

/**
 *  connection pool initializer
 */
var setupPool = exports.setupPool = function(config, callback){
    var pool = mysql.createPool(config);
    async.parallel(createParallelTaskPreConnections(pool, config), function (err, results) {
        if(!err){
            results.forEach(function(conn){
                conn.end();
            });
        }
        callback(err);
    });
    return pool;
};

/**
 *  initialize mysql event
 */
var connection_init = function(pool, conn){
    conn.on("error", function(err){
        event.onError(pool, conn, err);
    });
    heartbeats.push(function(){
        var t = process.uptime();
        conn.ping(function(){
            var resp = process.uptime() - t;
            event.onPingResponse(pool, conn, resp);
        });
    });
};

/**
 *  async.parallel task
 */
var createParallelTaskPreConnections = function(pool, config){
    var tasks = [];
    // test max connection
    for(var i=0; i<config.connectionLimit; ++i){
        tasks.push(function(next){
            var t = process.uptime();
            pool.getConnection(function(err, conn) {
                var resp = process.uptime() - t;
                if(err){
                    console.log("Error Config:" + JSON.stringify(config));
                    event.onPreConnectError(pool, err, resp);
                    return next(err, null);
                }
                connection_init(pool, conn);
                event.onPreConnectSuccess(pool, conn, resp);
                next(null, conn);
            });
        });
    }
    return tasks;
}


