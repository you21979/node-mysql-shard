var heartbeats = require("./lib/heartbeats");
var createGenId = require("./lib/create_gen_id");
var MysqlHorizontalPartition = require("./lib/mysql_horizontal_partition");
var MysqlVerticalPartition = require("./lib/mysql_vertical_partition");
exports.initialize = function(timer){
    heartbeats.start(timer || 120 * 1000);
}
exports.finalize = function(){
    heartbeats.end();
}
exports.createHorizontalPartition = function(name){
    return new MysqlHorizontalPartition(name);
}
exports.createVerticalPartition = function(name){
    return new MysqlVerticalPartition(name);
}
exports.createGenId = function(vertical, tablename, _timeout, _reserve){
    return createGenId(vertical, tablename, _timeout, _reserve);
}
