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
var cfgAuth = JSON.parse(fs.readFileSync("../conf/mysql_auth.json"));
var cfgShard = JSON.parse(fs.readFileSync("../conf/mysql_horizontal.json"));

var cluster = MysqlShard.createHorizontalPartition("hoge");

var pool = 5;
cluster.connect(cfgAuth.auth.user, cfgAuth.auth.password, pool, cfgShard, function(){
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

