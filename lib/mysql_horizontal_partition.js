"use strict";
var Util = require('util');
var EventEmitter = require('events').EventEmitter;
var BigNumber = require("bignumber.js");
var Pair = require('./mysql_pair');
var asyncTask = require('./async_task_complete');

module.exports = MysqlHorizontalPartition;

/**
 *  constructor
 */
function MysqlHorizontalPartition(name){
    this._name = name;      //!< name
    this._pairs = [];       //!< horizontal pair
}

Util.inherits(MysqlHorizontalPartition, EventEmitter);

/**
 *  horizontal connect all
 */
MysqlHorizontalPartition.prototype.connect = function(user, password, limit, config, callback){
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
    for( var key in config.database ){
        var count = 0;
        config.horizontal.forEach(function(conf){
            var database = config.database[key] + count++;
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
        });
    }
    task.join(function(){
        callback();
    });
}
//
MysqlHorizontalPartition.prototype.close = function(){
    this._pairs.forEach(function(p){
        p.close();
    });
    this._pairs.length = 0;
}
//
MysqlHorizontalPartition.prototype.select = function(key){
    var idx = selector(key, this._pairs.length);
    return this._pairs[idx];
};

// シャーディングのハッシュアルゴリズム
var selector = function(id,max){
    if(typeof id === 'number'){
        return id % max;
    }else if(typeof id === 'string'){
        throw new Error("unkonwn type");
    }else{
        if(id instanceof BigNumber){
            return id.modulo(new BigNumber(max)).toPrecision();
        }
    }
    assert(typeof id === 'number');
    throw new Error("unkonwn type");
};

