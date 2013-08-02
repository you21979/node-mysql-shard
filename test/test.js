"use strict";
var MysqlShard = require('../');
MysqlShard.initialize(2000);

var fs = require('fs');
var cfg = JSON.parse(fs.readFileSync("../conf/mysql.json"));

var cluster = MysqlShard.createCluster("hoge");

var pool = 5;
cluster.connect("root", "", pool, cfg, function(){
    console.log("ok");
    var db = cluster.select(1);
    var timeout = 10000;
    db.getMaster(timeout, function(err, conn){
        conn.query("select * from mysql;");
    });
});
