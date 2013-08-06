"use strict";
var heartbeats = function(){
    var taskLists = [];
    var started = false;
    var start = function(timer){
        if(started){
            return false;
        }
        var update = function(){
            setTimeout(function(){
                if(!started){
                    return;
                }
                taskLists.forEach(function(f){
                    f();
                });
                update();
            }, timer);
        }
        started = true;
        update();
        return true;
    };

    var end = function(){
        started = false;
    };

    var push = function(task){
        taskLists.push(task);
    };

    return {
        start : start,
        end : end,
        push : push,
    };
};

var h = module.exports = heartbeats();
