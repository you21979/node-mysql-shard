"use strict";
var Pair = require('./mysql_pair');
var checksync = require('./checksync');
var Util = require('util');
var EventEmitter = require('events').EventEmitter;

module.exports = Cluster;

/**
 *
 */
function Cluster(name){
    this._name = name;
    this._pairs = [];
}

Util.inherits(Cluster, EventEmitter);

//
Cluster.prototype.connect = function(user, password, limit, config, cb){
    var self = this;
    var sync = checksync(function(){
        cb();
    });
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
        config.cluster.forEach(function(conf){
            var master_config = convert(conf.master, config.database[key]);
            var slaves_config = [];
            conf.slaves.forEach(function(slave){
                slaves_config.push(convert(slave, config.database[key]));
            });
            var p = new Pair();
            sync.inc();
            p.connect(master_config, slaves_config, function(){
                sync.dec();
            });
            self._pairs.push(p);
        });
    }
}
//
Cluster.prototype.close = function(){
    this._pairs.forEach(function(p){
        p.close();
    });
}
//
Cluster.prototype.select = function(key){
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
        if(id instanceof BigInt){
            return id.modulo(new BigInt(max,0)).toNumber();
        }
    }
    assert(typeof id === 'number');
    throw new Error("unkonwn type");
};

/*
if(1){
    var heartbeats = require('./heartbeats');
    heartbeats.start(2000);
    var fs = require('fs');
    var cfgs = JSON.parse(fs.readFileSync("./mysql.json"));

    var xx = new Cluster("hoge");
    xx.connect("root", "", 5, cfgs, function(){
        console.log("ok");
        var ppp = xx.select(1);
        ppp.getMaster(500, function(err, conn){
            conn.query("select * from mysql;");
        });
    });
}
*/

