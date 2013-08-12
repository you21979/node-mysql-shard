"use strict";
var Util = require('util');
var EventEmitter = require('events').EventEmitter;
var BigNumber = require("bignumber.js");
var async = require('async');
var Pair = require('./mysql_pair');
var hashPJW = require('./hash_pjw');

module.exports = MysqlHorizontalPartition;

/**
 *  constructor
 */
function MysqlHorizontalPartition(name){
    this._name = name;          //!< name
    this._pairs = [];           //!< horizontal pair
    this._selector = selector;  //!< partition selector
}

Util.inherits(MysqlHorizontalPartition, EventEmitter);

var task_create_pair = function(self, user, password, limit, config){
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
    var tasks = [];
    for( var key in config.database ){
        var count = 0;
        config.horizontal.forEach(function(conf){
            tasks.push(function(next){
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
                p.connect(master_config, slaves_config, function(err){
                    next(err);
                });
                self._pairs.push(p);
            });
        });
    }
    return tasks;
}

/**
 *  horizontal connect all
 */
MysqlHorizontalPartition.prototype.connect = function(user, password, limit, config, callback){
    async.parallel(task_create_pair(this, user, password, limit, config), function (err, results) {
        callback(err);
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
    var idx = this._selector(key, this._pairs.length);
    return this._pairs[idx];
};
//
MysqlHorizontalPartition.prototype.forEach = function(callback){
    this._pairs.forEach(callback);
};

// default sharding selector
var selector = function(id,max){
    if(typeof id === 'number'){
        return id % max;
    }else if(typeof id === 'string'){
        return hashPJW(id, max);
    }else{
        if(id instanceof BigNumber){
            return id.modulo(new BigNumber(max)).toPrecision();
        }
    }
    throw new Error("unkonwn type");
};

