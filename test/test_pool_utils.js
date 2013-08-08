var poolUtils = require("../lib/pool_utils");
var configRead = require("../lib/config_read");

var cfgAuth = configRead.readAuth("../conf/mysql_auth.json");

var pool = poolUtils.setupPool({
    user : cfgAuth.auth.user,
    password : cfgAuth.auth.password,
    database : "mysql",
    connectionLimit : 10,
},function(err){
    if(err) throw err;
    console.log("OK");
    pool.end();
});

