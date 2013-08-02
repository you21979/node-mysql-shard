"use strict";
var poolutils = require('./pool_utils');
var Util = require('util');
var EventEmitter = require('events').EventEmitter;

module.exports = Pair;

function Pair(){
    this._master = null;
    this._slaves = [];

    this._slave_conns = [];
}

Util.inherits(Pair, EventEmitter);

Pair.prototype.connect = function(master_config, slave_configs, cb){
    var sync_count = 0;
    var sync_func = function(){
        --sync_count;
        if(sync_count === 0){
            cb();
        }else if(sync_count < 0){
            throw new Error("BUG : Sync Error");
        }
    }

    ++sync_count;
    this._master = poolutils(master_config, function(){
        sync_func();
    });
    var self = this;
    slave_configs.forEach(function(c){
        ++sync_count;
        var slave = poolutils(c, function(){
            for(var i=0; i<c.connectionLimit; ++i){
                ++sync_count;
                slave.getConnection(function(err, conn){
                    if(err){
                        throw err;
                    }
                    self._slave_conns.push(conn);
                    sync_func();
                });
            }
            sync_func();
        });
        self._slaves.push(slave);
    });
}

Pair.prototype.close = function(){
    this._master.end();
};

Pair.prototype.getMaster = function(timer, cb){
    this._master.getConnection(function(err, conn){
        var w = {
            disable : false,
            query : function(q, a, f){
                if(w.disable){
                    process.nextTick(function(){
                        f(new Error("Master Connection Timeout"), null);
                    });
                    return false;
                }
                return conn.query(q,a,f);
            },
            end : function(){
                if(!w.disable){
                    w.disable = true;
                    conn.end();
                }
            },
        };
        setTimeout( function(){
            w.end();
        }, timer );
        
        cb(err, w);
    });
};

Pair.prototype.getSlave = function(cb){
    var rnd = Math.floor(Math.random() * this._slave_conns.length);
    var conn = this._slave_conns[rnd];
    var w = {
        query : function(q, a, f){
            return conn.query(q, a, f);
        },
    };
    cb(w);
};

/*
var mysqlConfig = {
    host : "127.0.0.1",
    port : 3306,
    user : "root",
    password : "",
    database : "test",
    debug : false,
    connectionLimit : 10,
};
var x = new Pair();
x.connect(mysqlConfig, [mysqlConfig,mysqlConfig], function(){
    console.log("ok");

    x.getMaster(1 * 1000, function(e,c){
    });

    x.getSlave(function(c){
        c.query("show status;",function(ee,rr){
        });
    });
});
*/

