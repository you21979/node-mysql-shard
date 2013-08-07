"use strict";
var Util = require('util');
var EventEmitter = require('events').EventEmitter;

var XATX = module.exports = function(){
    EventEmitter.call(this);
}
Util.inherits(XATX, EventEmitter);
XATX.prototype.query = function(id, q, p, c){
    this.emit("query", id, q, p, c);
}
XATX.prototype.quit = function(result){
    this.emit("quit", result);
}
