"use strict";
var query_decode = exports.query_decode = function(sql, param){
    var out = sql;
    param.forEach(function(v){
        var w="";
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

