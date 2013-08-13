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

    this._master_conns = {};//!< getConnect master connection pool
    this._slave_conns = []; //!< slave connection pool
}

Util.inherits(Pair, EventEmitter);

/**
 *  master / slaves pair connection
 */
Pair.prototype.connect = function(master_config, slave_configs, cb){

    if( slave_configs instanceof Array
     && slave_configs.length === 0){
        throw new Error("please slave config setup");
    }

    var self = this;
    var tasks = [];

    // master connect initialize
    tasks.push(function(next){
        self._master = PoolUtils.setupPool(master_config, function(err){
            next(err);
        });
    });

    // slave connect initialize
    tasks.push(function(next){
        async.parallel(task_create_pool( self, slave_configs ), function (err, results) {
            if(err){
                return next(err, null);
            }
            results.forEach(function(slave){
                slave.conns.forEach(function(conn){
                    self._slave_conns.push(conn);
                });
                self._slaves.push(slave.pool);
            });
            next(err, results);
        });
    });

    // run
    async.parallel(tasks, function (err, results) {
        cb(err);
    });
}

/**
 *  close
 */
Pair.prototype.close = function(){
    for(var k in this._master_conns){
        this._master_conns[k].quit();
    }
    this._master_conns = {};

    this._slave_conns.forEach(function(conn){
        conn.end();
    });
    this._slave_conns.length = 0;

    if(this._master){
        this._master.end();
    }
    this._slaves.forEach(function(slave){
        slave.end();
    });
};

/**
 *  get master connection
 */
Pair.prototype.getMaster = function(timer, cb){
    var self = this;
    this._master.getConnection(function(err, conn){
        var tc = new TimerClient(conn, timer);
        tc.on("quit", function(){
            delete self._master_conns[tc.getId()];
        });
        self._master_conns[tc.getId()] = tc;
        process.nextTick(function(){
            cb(err, tc);
        });
    });
};

/**
 *  get slave connection
 */
Pair.prototype.getSlave = function(cb){
    if(this._slave_conns.length === 0){
        return cb(new Error("do not connection"), null);
    }
    var rnd = Math.floor(Math.random() * this._slave_conns.length);
    var conn = this._slave_conns[rnd];
    process.nextTick(function(){
        cb(null, conn);
    });
};

// -----------------------------------------------------------
// private functions
// -----------------------------------------------------------

var task_create_connection = function( pool, connectmax ){
    var tasks = [];
    for(var i = 0; i < connectmax; ++i){
        tasks.push(function(next){
            pool.getConnection(function(err, conn){
                if(err){
                    return next(err, null);
                }
                return next(err, conn);
            });
        });
    }
    return tasks;
};

var task_create_pool = function( self, configs ){
    var tasks = [];
    configs.forEach(function(config){
        tasks.push(function(next){
            var pool = PoolUtils.setupPool(config, function(){
                // connection pool begin
                async.parallel(task_create_connection(pool, config.connectionLimit), function (err, results) {
                    if(err){
                        pool.close();
                        return next(err, null);
                    }
                    next(err, {pool:pool, conns:results});
                });
            });
        });
    });
    return tasks;
};

