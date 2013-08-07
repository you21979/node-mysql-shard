"use strict";
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
}

var traceflag = true;
var enable = exports.enable = function(){
    traceflag = true;
}
var disable = exports.disable = function(){
    traceflag = false;
}
var trace = exports.trace = function(data){
    if(traceflag){
        console.log(":"+data);
    }
}
var querycallback = function( did, sql, param, callback ){
    trace("S->:" + did + ":" + query_decode(sql, param));
    return function( err, arg1, arg2 ){
        trace("<-R:" + did + ":" + query_decode(sql, param));
        if(err){
            trace(err);
        }
        callback(err, arg1, arg2);
    };
}
var uniq_id = 0;
var query = exports.query = function( conn, sql, param, callback ){
    return conn.query( sql, param, querycallback(++uniq_id, sql, param, callback) );
}
