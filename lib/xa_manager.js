"use strict";
var Util = require('util');
var EventEmitter = require('events').EventEmitter;
var async = require("async");

var XAQuery = require('./xa_query');
var XATX = require('./xa_tx');

/*
 *  constructor
 */
var XAManager = module.exports = function(){
    EventEmitter.call(this);
    this._conn = {};
    this._tx = new XATX();
    this._result_cb = function(err, res){}
    txinit(this);
}
Util.inherits(XAManager, EventEmitter);

/*
 *  add connection
 */
XAManager.prototype.add = function(id, conn){
    this._conn[id] = conn;
    return this;
}
/*
 *  create transaction
 */
XAManager.prototype.tx = function(callback){
    var self = this;
    async.series(task_create_tx_begin( self ), function (err, results) {
        if(err){
            return xa_quit(self, function(){
                self._result_cb(err, results);
            });
        }
        callback(self._tx);
    });
    return this;
}
/*
 *  result transaction
 */
XAManager.prototype.result = function(callback){
    this._result_cb = callback;
    return this;
}

// -----------------------------------------------------------
// private functions
// -----------------------------------------------------------

var xa_quit = function(self, callback){
    for(var k in self._conn){
        var c = self._conn[k];
        c.quit();
    }
    callback();
};

var task_create_query = function(self, make_task){
    var tasks = [];
    for(var k in self._conn){ tasks.push(make_task(self._conn[k])); }
    return tasks;
};

var task_create_tx_begin = function(self){
    return task_create_query(self, function(conn){
        return function(next){
            conn.begin(function(err, res){ next(err, res); });
        };
    });
};
var task_create_tx_end = function(self){
    return task_create_query(self, function(conn){
        return function(next){
            conn.end(function(err, res){ next(err, res); });
        };
    });
};
var task_create_tx_prepare = function(self){
    return task_create_query(self, function(conn){
        return function(next){
            conn.prepare(function(err, res){ next(err, res); });
        };
    });
};
var task_create_tx_commit = function(self){
    return task_create_query(self, function(conn){
        return function(next){
            conn.commit(function(err, res){ next(err, res); });
        };
    });
};
var task_create_tx_rollback = function(self){
    return task_create_query(self, function(conn){
        return function(next){
            conn.rollback(function(err, res){ next(err, res); });
        };
    });
};

/*
 *  transaction flow
 */
var txinit = function(self){
    self._tx.on("query", function(id, sql, param, callback){
        var c = self._conn[id];
        c.query(sql, param, callback);
    });
    self._tx.on("quit", function(err){
        if(err){
            return xa_quit(self, function(){
                self._result_cb(err, null);
            });
        }
        async.waterfall([
            function (next){
                async.parallel(task_create_tx_end( self ), function (err, results) {
                    next(err);
                });
            },
            function (next){
                async.parallel(task_create_tx_prepare( self ), function (err, results) {
                    if(err){
                        async.parallel(task_create_tx_rollback( self ), function (err, results) {
                            next(err);
                        });
                    }else{
                        async.parallel(task_create_tx_commit( self ), function (err, results) {
                            next(err);
                        });
                    }
                });
            }
        ], function (err, result) {
            xa_quit(self, function(){
                self._result_cb(err, result);
            });
        });
    });
};

