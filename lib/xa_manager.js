"use strict";
var Util = require('util');
var EventEmitter = require('events').EventEmitter;
var asyncTask = require("../lib/async_task_complete");
var async = require("async");

var XAQuery = require('./xa_query');
var XATX = require('./xa_tx');

var txinit = function(xam){
    xam._tx.on("query", function(id,sql,param,callback){
        var c = xam._conn[id];
        c.query(sql, param, callback);
    });
    xam._tx.on("quit", function(result){
        async.waterfall([
            function end(callback){
                var task = asyncTask();
                for(var k in xam._conn){
                    var c = xam._conn[k];
                    task.enter();
                    c.end(function(err, res){
                        task.leave();
                    });
                }
                task.join(function(){
                    callback(null);
                });
            },
            function prepare(callback){
                var task = asyncTask();
                for(var k in xam._conn){
                    var c = xam._conn[k];
                    task.enter();
                    c.prepare(function(err, res){
                        task.leave();
                    });
                }
                task.join(function(){
                    callback(null);
                });
            },
            function commit(callback){
                var task = asyncTask();
                for(var k in xam._conn){
                    var c = xam._conn[k];
                    task.enter();
                    c.commit(function(err, res){
                        task.leave();
                    });
                }
                task.join(function(){
                    for(var k in xam._conn){
                        var c = xam._conn[k];
                        c.quit();
                    }
                    callback(null);
                });
            }
        ], function (err, result) {
            xam._result_cb(null, null);
        });
    });
}

var XAManager = module.exports = function(){
    this._conn = {};
    this._tx = new XATX();
    this._result_cb = function(){}
    this._error_cb = function(){}
    txinit(this);
}
XAManager.prototype.add = function(id,conn){
    this._conn[id] = new XAQuery(conn, id.toString());
    return this;
}
XAManager.prototype.tx = function(callback){
    for(var k in this._conn){
        this._conn[k].begin();
    }
    var self = this;
    process.nextTick(function(){
        callback(self._tx);
    });
    return this;
}
XAManager.prototype.result = function(callback){
    this._result_cb = callback;
    return this;
}
XAManager.prototype.error = function(callback){
    this._error_cb = callback;
    return this;
}


/*
var asyncTask = require("../lib/async_task_complete");

XAManager.prototype.add = function(xaq){
    this._q.push(xaq);
}
XAManager.prototype.prepare = function(callback){
    var task = asyncTask();
    this._q.forEach(function(v){
        task.enter();
        var id = v.getId();
        v.prepare(function(err, val){
            task.setResult(id,err);
            task.leave();
        });
    });
    var self = this;
    task.join(function(){
        var ret = true;
        self._q.forEach(function(v){
            var err = task.getResult(v.getId());
            if(err){
                console.log(err);
                ret = false;
            }
        });
        callback(ret);
    });
}
XAManager.prototype.commit = function(callback){
    var task = asyncTask();
    this._q.forEach(function(v){
        task.enter();
        var id = v.getId();
        v.commit(function(err, val){
            task.setResult(id,err);
            task.leave();
        });
    });
    var self = this;
    task.join(function(){
        var ret = true;
        self._q.forEach(function(v){
            var err = task.getResult(v.getId());
            if(err){
                console.log(err);
                ret = false;
            }
        });
        callback(ret);
    });
}
XAManager.prototype.quit = function(){
    this._q.forEach(function(v){
        v.quit();
    });
}
*/
