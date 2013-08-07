"use strict";
var Util = require('util');
var EventEmitter = require('events').EventEmitter;

/**
 *  XA Query Wrapper
 */
var XAQuery = module.exports = function(conn, txid){
    if(!("query" in conn)){
        throw new Error("unknown conn");
    }
    EventEmitter.call(this);
    this._conn = conn;
    this._txid = txid;
}
Util.inherits(XAQuery, EventEmitter);

XAQuery.prototype.getId = function(){
    return this._txid;
}

XAQuery.prototype.begin = function(callback){
    this._conn.query("XA BEGIN ?", [this._txid], callback);
    return this;
}
XAQuery.prototype.end = function(callback){
    this._conn.query("XA END ?", [this._txid], callback);
    return this;
}
XAQuery.prototype.query = function(sql, param, callback){
    this._conn.query(sql, param, callback);
    return this;
}
XAQuery.prototype.prepare = function(callback){
    this._conn.query("XA PREPARE ?", [this._txid], callback);
}
XAQuery.prototype.commit = function(callback){
    this._conn.query("XA COMMIT ?", [this._txid], callback);
}
XAQuery.prototype.rollback = function(callback){
    this._conn.query("XA ROLLBACK ?", [this._txid], callback);
}
XAQuery.prototype.quit = function(){
    this._conn.quit();
}
