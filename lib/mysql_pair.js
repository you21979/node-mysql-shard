"use strict";
var Util = require('util');
var EventEmitter = require('events').EventEmitter;
var async = require('async');
var PoolUtils = require('./pool_utils');
var TimerClient = require("./timer_client");
var debug = require("./debug");

module.exports = Pair;

/**
 *  constructor
 */
function Pair(){
    this._master = null;    //!< read/write
    this._slaves = [];      //!< read only

    this._slave_conns = []; //!< slave connection pool
}

Util.inherits(Pair, EventEmitter);

/**
 *  master / slaves pair connection
 */
Pair.prototype.connect = function(master_config, slave_configs, cb){

    var self = this;
    var tasks = [];

    if( slave_configs instanceof Array
     && slave_configs.length === 0){
        throw new Error("please slave config setup");
    }

    // master connect initialize
    tasks.push(function(next){
        self._master = PoolUtils.setupPool(master_config, function(err){
            next(err);
        });
    });

    // slave connect initialize
    tasks.push(function(next){
        var slavetasks = [];
        slave_configs.forEach(function(c){
            slavetasks.push(function(next){
                var slave = PoolUtils.setupPool(c, function(){
                    var slaveconntasks = [];
                    for(var i=0; i<c.connectionLimit; ++i){
                        slaveconntasks.push(function(next){
                            slave.getConnection(function(err, conn){
                                if(err){
                                    return next(err, null);
                                }
                                self._slave_conns.push(conn);
                                return next(err, conn);
                            });
                        });
                    }
                    // connection pool begin
                    async.parallel(slaveconntasks, function (err, results) {
                        next(err);
                    });
                });
                self._slaves.push(slave);
            });
        });
        async.parallel(slavetasks, function (err, results) {
            next(err);
        });
    });
    async.parallel(tasks, function (err, results) {
        cb(err);
    });
}

Pair.prototype.close = function(){
    if(this._master){
        this._master.end();
    }
    this._slave_conns.forEach(function(c){
        c.end();
    });
    this._slave_conns.length = 0;
    this._slaves.forEach(function(slave){
        slave.end();
    });
};

// get master connection
Pair.prototype.getMaster = function(timer, cb){
    var self = this;
    this._master.getConnection(function(err, conn){
        process.nextTick(function(){
            cb(err, new TimerClient(conn, timer));
        });
    });
};

// get slave connection
Pair.prototype.getSlave = function(cb){
    var rnd = Math.floor(Math.random() * this._slave_conns.length);
    var conn = this._slave_conns[rnd];
    process.nextTick(function(){
        cb(null, conn);
    });
};

/*
var mysqlConfig = {
    host : "127.0.0.1",
    port : 3306,
    user : "root",
    password : "",
    database : "test",
    debug : false,
    connectionLimit : 10,
};
var x = new Pair();
x.connect(mysqlConfig, [mysqlConfig,mysqlConfig], function(){
    console.log("ok");

    x.getMaster(1 * 1000, function(e,c){
    });

    x.getSlave(function(c){
        c.query("show status;",function(ee,rr){
        });
    });
});
*/

