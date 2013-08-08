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
var x = new MysqlPair();
x.connect(mysqlConfig, [mysqlConfig,mysqlConfig], function(){
    console.log("ok");

    x.getMaster(1 * 1000, function(e,c){
        c.quit();
    });

    x.getSlave(function(e,c){
        c.query("show status;",function(ee,rr){
            x.close();
        });
    });
});

