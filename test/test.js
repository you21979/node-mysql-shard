"use strict";
var MysqlShard = require('../');
MysqlShard.initialize(2000);
var PoolUtil = require('../lib/pool_utils.js');
PoolUtil.event.onPingResponse = function(conn, latency){
    console.log(latency);
}
PoolUtil.event.onConnect = function(conn, latency){
    console.log(latency);
}

var fs = require('fs');
var cfg = JSON.parse(fs.readFileSync("../conf/mysql.json"));

var cluster = MysqlShard.createCluster("hoge");

var pool = 5;
cluster.connect("root", "", pool, cfg, function(){
    console.log("ok");
    var db = cluster.select(1);
    var timeout = 1 * 1000;
    for(var i=0;i<100;++i){
        db.getMaster(timeout, function(err, conn){
            conn.query("select 1;", function(err, res){
                console.log(res);
                conn.end();
            });
        });
    }
});
cluster.on("error", function(param){
    console.log(param.reason);
})
setTimeout(function(){
    cluster.close();
    MysqlShard.finalize();
}, 2 * 1000);

