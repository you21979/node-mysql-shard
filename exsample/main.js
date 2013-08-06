var MysqlShard = require("../");
var asyncTask = require("../lib/async_task_complete.js");

var fs = require('fs');

var TIMEOUT = 10000;

var main = function(){
    MysqlShard.initialize(2000);
    var cfgAuth = JSON.parse(fs.readFileSync("./conf/mysql_auth.json"));
    var cfgHorizontal = JSON.parse(fs.readFileSync("./conf/mysql_horizontal.json"));
    var cfgVertical = JSON.parse(fs.readFileSync("./conf/mysql_vertical.json"));

    var work = {};
    work.manage = MysqlShard.createVerticalPartition("manage");
    work.shard = MysqlShard.createHorizontalPartition("shard");
    work.gen_users_id = MysqlShard.createGenId(work.manage, "users_id");

    var task = asyncTask();
    var pool = 2;
    task.enter();
    work.manage.connect(cfgAuth.auth.user, cfgAuth.auth.password, pool, cfgVertical, function(){
        console.log("manage connect ok");
        task.leave();
    });
    work.manage.on("error",function(e){console.log(e);throw new Error("");});
    task.enter();
    work.shard.connect(cfgAuth.auth.user, cfgAuth.auth.password, pool, cfgHorizontal, function(){
        console.log("shard connect ok");
        task.leave();
    });
    work.shard.on("error",function(e){console.log(e);});
    task.join(function(){
        hoge(work);

/*
        insert(work);
        insert(work);
        select(work);
*/
    });
}
var hoge = function(work){
    work.shard.forEach(function(s){
        s.getSlave(function(err, conn){
            conn.query("select * from users;", [], function(err, row){
                console.log(row);
            });
        });
    });
}

var insert = function(work){
    work.gen_users_id(function(id){
        work.shard.select(id).getMaster(10000, function(err, conn){
            conn.query("begin");
            conn.query("insert into users(id,name) values(?,?);",[id,"hoge"]);
            conn.query("commit");
            conn.quit();
        });
    });
}

var select = function(work){
    work.shard.forEach(function(s){
        s.getSlave(function(err, conn){
            conn.query("select * from users;", [], function(err, row){
                console.log(row);
            });
        });
    });
}

main();
