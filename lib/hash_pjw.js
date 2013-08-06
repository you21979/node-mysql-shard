"use strict";
var SIZE_BITS = 32;
var hash_pjw = module.exports = function(str, tablesize){
    var s = new Buffer(str);
    var len = s.length;
    var h = 0;
    var BITS = SIZE_BITS - 9;
    for(var i=0; i<len; ++i){
        h = s[i] + ((h << 9) | (h >>> BITS));
    }
    return (h >>> 0) % tablesize;
}
