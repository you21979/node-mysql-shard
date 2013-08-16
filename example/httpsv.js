var MysqlShard = require("../");
var http = require('http');
var async = require('async');
var fs = require('fs');

var PORT = 8080;

var server = http.createServer(function(req, res) {
  if (req.url === '/') {
    q(function(err,result){
        var index = "";
        if(err) index = "NG";
        else index = "OK";
        res.writeHead(200, {'content-type': 'text/html',
                    'content-length': Buffer.byteLength(index)});
        res.end(index);
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});
var work = {};

var TIMEOUT = 10000;

var q = function(callback){
    var id1 = 17269835;
    var id2 = 17269836;

    async.parallel([
        function (next) {
            work.shard.select(id1).getMaster(TIMEOUT, function(err, conn){
                next(err, {id:id1, conn:conn});
            });
        },
        function (next) {
            work.shard.select(id2).getMaster(TIMEOUT, function(err, conn){
                next(err, {id:id2, conn:conn});
            });
        }
    ], function (err, results) {
        if(err) return callback(err, results);

        MysqlShard.createXAManager()
        .add(results[0].id, MysqlShard.createXAQuery(results[0].conn, results[0].id.toString()))
        .add(results[1].id, MysqlShard.createXAQuery(results[1].conn, results[1].id.toString()))
        .tx(function(tx){

            async.waterfall([
                function(next){
                    tx.query(id1, "select 1;", [], function(err, rows){
                        next(err);
                    });
                }
            ], function (err, result) {
                tx.quit(err);
            });
        }).result(function(err, res){
            if(err) console.log("NG");
            else console.log("OK");
            callback(err, res);
        });
    });
}



var main = function(){
    MysqlShard.initialize(2000);

    var cfgAuth = JSON.parse(fs.readFileSync("./conf/mysql_auth.json"));
    var cfgHorizontal = JSON.parse(fs.readFileSync("./conf/mysql_horizontal.json"));
    var cfgVertical = JSON.parse(fs.readFileSync("./conf/mysql_vertical.json"));

    work.manage = MysqlShard.createVerticalPartition("manage");
    work.shard = MysqlShard.createHorizontalPartition("shard");
    work.gen_users_id = MysqlShard.createGenId(work.manage, "users_id");

    var pool = 20;
    async.parallel([
        function (next) {
            work.manage.connect(cfgAuth.auth.user, cfgAuth.auth.password, pool, cfgVertical, function(err){
                console.log("manage connect ok");
                next(err, null);
            });
        },
        function (next) {
            work.shard.connect(cfgAuth.auth.user, cfgAuth.auth.password, pool, cfgHorizontal, function(err){
                console.log("shard connect ok");
                next(err, null);
            });
        }
    ], function (err, results) {
        if(err) throw err;

        server.listen(PORT, function(err) {
            console.log('Listening on ' + PORT);
        });
    });
}

main();
