"use strict";
var Util = require('util');
var EventEmitter = require('events').EventEmitter;
var debug = require("./debug");

/*
 * timer initialize
 */
var timerinit = function(self, timer){
    self._timerid = setTimeout( function(){
        if(self.isEnable()){
            debug.trace("TimerClient Timeout " + self._id);
            self.emit("timeout");
            self.quit();
        }
    }, timer );
};

var uid = 0;
/*
 * constructor
 */
var TimerClient = module.exports = function(conn, timer){
    EventEmitter.call(this);

    this._id = ++uid;
    this._conn = conn;
    this._timerid = null;

    timerinit(this, timer);

    debug.trace("TimerClient connect " + this._id);
};
Util.inherits(TimerClient, EventEmitter);

/*
 *
 */
TimerClient.prototype.getId = function(){
    return this._id;
};

/*
 * handle check enable
 */
TimerClient.prototype.isEnable = function(){
    return this._timerid ? true : false;
};

/*
 * query
 */
TimerClient.prototype.query = function(sql, param, callback){
    if(!this.isEnable()){
        debug.trace("TimerClient Disable " + this._id);
        process.nextTick(function(){
            callback(new Error("Master Connection Timeout"), null);
        });
        return false;
    }
    return debug.query( this._id, this._conn, sql, param, callback );
};

/*
 * handle close
 */
TimerClient.prototype.quit = function(){
    if(this.isEnable()){
        debug.trace("TimerClient quit " + this._id);
        clearTimeout(this._timerid);
        this._timerid = null;
        this._conn.end();
        this.emit("quit");
    }
};
