"use strict";
var traceflag = true;
var enable = exports.enable = function(){
    traceflag = true;
};
var disable = exports.disable = function(){
    traceflag = false;
};
var query_count = 0;
var query = exports.query = function( cid, conn, sql, param, callback ){
    return conn.query( sql, param, querycallback(cid, ++query_count, sql, param, callback) );
};
var querycallback = function( cid, did, sql, param, callback ){
    trace("S->:" + cid + ":" + query_decode(sql, param));
    return function( err, arg1, arg2 ){
        trace("R<-:" + cid + ":" + query_decode(sql, param));
        if(err){
            trace(err.stack);
        }
        callback(err, arg1, arg2);
    };
};
var query_decode = exports.query_decode = function(sql, param){
    var out = sql;
    param.forEach(function(v){
        var w = "";
        switch(typeof v){
        case "string":
            w = "'" + v + "'";
            break;
        case "number":
            w = v.toString();
            break;
        }
        out = out.replace("?", w);
    });
    return out;
};
var trace = exports.trace = function(data){
    if(traceflag){
        console.log(":"+data);
    }
};
