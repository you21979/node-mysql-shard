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
    this._pairs = {};       //!< vertical pair
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
        conf.tables.forEach(function(table){
            self._pairs[table] = p;
        });
    });
    task.join(function(){
        callback();
    });
}
//
MysqlVerticalPartition.prototype.close = function(){
    for(var key in this._pairs){
        this._pairs[key].close();
    }
}
//
MysqlVerticalPartition.prototype.select = function(database){
    return this._pairs[database];
};

/*
if(1){
    var heartbeats = require('./heartbeats');
    heartbeats.start(2000);
    var fs = require('fs');
    var cfgs = JSON.parse(fs.readFileSync("../conf/mysql_manage.json"));

    var xx = new MysqlVerticalPartition();
    xx.connect("root", "", 5, cfgs, function(){
        console.log("ok");
        var ppp = xx.select("gen_player_seqid");
        ppp.getMaster(500, function(err, conn){
            conn.query("select 1;");
        });
    });
    xx.on("error", function(param){
        console.log(param.reason);
    });
}
*/
