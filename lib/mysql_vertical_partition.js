"use strict";
var Util = require('util');
var EventEmitter = require('events').EventEmitter;
var Pair = require('./mysql_pair');
var asyncTask = require('./async_task_complete');

module.exports = MysqlVerticalPartition;

/**
 *  constructor
 */
function MysqlVerticalPartition(name){
    this._name = name;
    this._pairs = [];       //!< vertical pair
    this._lookup = {};       //!< vertical lookup
}

Util.inherits(MysqlVerticalPartition, EventEmitter);

/**
 *  cluster connect all
 */
MysqlVerticalPartition.prototype.connect = function(user, password, limit, config, callback){
    var self = this;
    var task = asyncTask();
    var convert = function(host, database){
        var lists = host.split(":");
        return {
            host : lists[0],
            port : lists[1],
            database : database,
            user : user,
            password : password,
            connectionLimit : limit,
        };
    }
    config.vertical.forEach(function(conf){
        var database = conf.database;
        var master_config = convert(conf.master, database);
        var slaves_config = [];
        conf.slaves.forEach(function(slave){
            slaves_config.push(convert(slave, database));
        });
        var p = new Pair();
        p.on("error", function(param){
            self.emit("error", param);
        });
        task.enter();
        p.connect(master_config, slaves_config, function(){
            task.leave();
        });
        self._pairs.push(p);
        conf.tables.forEach(function(table){
            self._lookup[table] = p;
        });
    });
    task.join(function(){
        callback();
    });
}
//
MysqlVerticalPartition.prototype.close = function(){
    this._pairs.forEach(function(p){
        p.close();
    });
    this._pairs.length = 0;
    this._lookup = {};
}
//
MysqlVerticalPartition.prototype.select = function(database){
    return this._lookup[database];
};

