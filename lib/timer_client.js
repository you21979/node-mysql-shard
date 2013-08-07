"use strict";
var Util = require('util');
var EventEmitter = require('events').EventEmitter;
var debug = require("./debug");

var timerinit = function(self, timer){
    setTimeout( function(){
        if(!self.disable){
            self.emit("error", new Error("timeout"));
        }
        self.quit();
    }, timer );
}

var TimerClient = module.exports = function(conn, timer){
    EventEmitter.call(this);
    this._conn = conn;
    this._disable = false;
    timerinit(this, timer);
}
Util.inherits(TimerClient, EventEmitter);

TimerClient.prototype.query = function(sql, param, callback){
    if(this._disable){
        debug.trace("Master Connection Timeout");
        process.nextTick(function(){
            callback(new Error("Master Connection Timeout"), null);
        });
        return false;
    }
    return debug.query( this._conn, sql, param, callback );
};
TimerClient.prototype.quit = function(){
    if(!this._disable){
        this._disable = true;
        this._conn.end();
    }
};
