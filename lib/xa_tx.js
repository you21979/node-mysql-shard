"use strict";
var Util = require('util');
var EventEmitter = require('events').EventEmitter;

var XATX = module.exports = function(){
    EventEmitter.call(this);
}
Util.inherits(XATX, EventEmitter);
XATX.prototype.query = function(id, sql, param, callback){
    this.emit("query", id, sql, param, callback);
}
XATX.prototype.quit = function(result){
    this.emit("quit", result);
}
