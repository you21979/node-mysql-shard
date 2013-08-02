"use strict";
var checksync = function(_cb){
    var sync_count = 0;
    var cb = _cb;
    var dec = function(){
        --sync_count;
        if(sync_count === 0){
            cb();
        }else if(sync_count < 0){
            throw new Error("BUG : Sync Error");
        }
    }
    var inc = function(){
        ++sync_count;
    }
    return {
        callback : function(_cb){
            cb = _cb;
        },
        inc : inc,
        dec : dec,
    };
}
module.exports = checksync;
