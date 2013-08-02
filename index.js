var heartbeats = require("./lib/heartbeats");
var MysqlCluster = require("./lib/mysql_cluster");
exports.initialize = function(timer){
    heartbeats.start(timer || 120 * 1000);
}
exports.finalize = function(){
    heartbeats.end();
}
exports.createCluster = function(clustername){
    return new MysqlCluster(clustername);
}
