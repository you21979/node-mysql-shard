var MysqlShard = require("../");
var asyncTask = require("../lib/async_task_complete");

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
        insert(work);
        hoge1(work);
    });
}

var async = require('async');
var hoge1 = function(work){

    var id1 = 17269835;
    var id2 = 17269836;

    async.parallel([
        function (callback) {
            work.shard.select(id1).getMaster(TIMEOUT, function(err, conn){
                callback(err, {id:id1, conn:conn});
            });
        },
        function (callback) {
            work.shard.select(id2).getMaster(TIMEOUT, function(err, conn){
                callback(err, {id:id2, conn:conn});
            });
        }
    ], function (err, results) {
        var xam = new MysqlShard.XAManager();
        xam
        .add(results[0].id, new MysqlShard.XAQuery(results[0].conn, results[0].id.toString()))
        .add(results[1].id, new MysqlShard.XAQuery(results[1].conn, results[1].id.toString()))
        .tx(function(tx){

            async.waterfall([
                function(callback){
                    tx.query(id1, "SELECT *aa FROM users where id=?;", [id1], function(err, rows){
                        if(err){
                            return callback(err, null);
                        }
                        callback(null, rows[0]);
                    });
                },
                function(val, callback){
                    tx.query(id2, "UPDATE users SET name = ? where id=?;", [val.name, id2], function(err, rows){
                        if(err){
                            return callback(err, null);
                        }
                        callback(null);
                    });
                }
            ], function (err, result) {
                tx.quit(err);
            });

        }).result(function(err, res){
            console.log("OK");
        });
    });
}

var insert = function(work){
    work.gen_users_id(function(id){
        work.shard.select(id).getMaster(TIMEOUT, function(err, conn){
            var xam = new MysqlShard.XAManager();
            xam
            .add(id, new MysqlShard.XAQuery(conn, id.toString()))
            .tx(function(tx){

                async.waterfall([
                    function(callback){
                        tx.query(id, "insert into users(id,name) values(?,?);",[id,"hoge"], function(err, rows){
                            callback(err);
                        });
                    }
                ], function (err, result) {
                    tx.quit(err);
                });

            }).result(function(err, res){
                console.log("OK");
            });
        });
    });
}

main();
