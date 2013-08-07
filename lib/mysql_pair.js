"use strict";
var Util = require('util');
var EventEmitter = require('events').EventEmitter;
var PoolUtils = require('./pool_utils');
var asyncTask = require('./async_task_complete');
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
    var task = asyncTask();

    // master connect initialize
    task.enter();
    this._master = PoolUtils.setup(master_config, function(){
        task.leave();
    });

    // slave connect initialize
    var self = this;
    slave_configs.forEach(function(c){
        task.enter();
        var slave = PoolUtils.setup(c, function(){
            // self connection pool
            for(var i=0; i<c.connectionLimit; ++i){
                task.enter();
                slave.getConnection(function(err, conn){
                    if(err){
                        throw err;
                    }
                    self._slave_conns.push(conn);
                    task.leave();
                });
            }
            task.leave();
        });
        self._slaves.push(slave);
    });

    // async task check
    task.join(function(){
        cb();
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

