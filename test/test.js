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
var cfgHorizontal = JSON.parse(fs.readFileSync("../conf/mysql_horizontal.json"));
var cfgVertical = JSON.parse(fs.readFileSync("../conf/mysql_vertical.json"));

var horizontal = MysqlShard.createHorizontalPartition("hoge");
var vertical = MysqlShard.createVerticalPartition("hoge");

var pool = 5;
horizontal.connect(cfgAuth.auth.user, cfgAuth.auth.password, pool, cfgHorizontal, function(){
    console.log("hok");
    var db = horizontal.select(1);
    var timeout = 1 * 1000;
    for(var i=0;i<100;++i){
        db.getMaster(timeout, function(err, conn){
            conn.query("select 1;", function(err, res){
                console.log(res);
                conn.quit();
            });
        });
    }
});
horizontal.on("error", function(param){
    console.log(param.reason);
})
vertical.connect(cfgAuth.auth.user, cfgAuth.auth.password, pool, cfgVertical, function(){
    console.log("vok");
    var db = vertical.select("gen_player_seqid");
    var timeout = 1 * 1000;
    for(var i=0;i<100;++i){
        db.getMaster(timeout, function(err, conn){
            conn.query("select 2;", function(err, res){
                console.log(res);
                conn.quit();
            });
        });
    }
});
vertical.on("error", function(param){
    console.log(param.reason);
})
setTimeout(function(){
    horizontal.close();
    vertical.close();
    MysqlShard.finalize();
}, 2 * 1000);

