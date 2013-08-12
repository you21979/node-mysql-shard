var MysqlPair = require("../lib/mysql_pair");
var configRead = require("../lib/config_read");

var cfgAuth = configRead.readAuth("../conf/mysql_auth.json");

var mysqlConfig = {
    user : cfgAuth.auth.user,
    password : cfgAuth.auth.password,
    database : "mysql",
    connectionLimit : 10,
    host : "127.0.0.1",
    port : 3306,
    debug : false,
};
var p = new MysqlPair();
p.connect(mysqlConfig, [mysqlConfig,mysqlConfig], function(){
    p.getMaster(1 * 1000, function(err,conn){
        if(err) throw err;
        conn.quit();
    });

    p.getSlave(function(err,conn){
        if(err) throw err;
        conn.query("show status;",function(err,res){
            p.close();
        });
    });
});

