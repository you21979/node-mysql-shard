var MysqlVerticalPartition = require("./mysql_vertical_partition");
var createGenId = module.exports = function(vertical, tablename, _timeout, _reserve){
    var timeout = _timeout || 10000;
    var reserve = _reserve || 10;
    var count = reserve;
    var current = 0;
    var queue = [];

    if(!(vertical instanceof MysqlVerticalPartition)){
        throw new Error("vertical is unknown object");
    }

    var id_mining = function(callback){
        var p = vertical.select(tablename);
        p.getMaster(timeout, function(err, conn){
            conn.query("call gen_" + tablename + "(?);", [reserve], function(err, row){
                if(err) throw err;
                var id = parseInt(row[0][0].id);
                callback(id);
            });
            conn.quit();
        });
    }
    var miningflg = false;
    var update = function(callback){
        if(miningflg){
            queue.push(callback);
            return;
        }
        miningflg = true;
        id_mining(function(id){
            current = id;
            count = 0;
            miningflg = false;
            callback();
            var len = queue.length;
            for(var i=0; i<len; ++i){
                queue[i]();
            }
            queue.splice(0, len);
        });
    }
    var gen = function(callback){
        if(reserve === count){
            update(function(){
                gen(callback);
            });
        }else{
            callback(current + count);
            ++count;
        }
    }
    return function(callback){
        gen(callback);
    }
}
