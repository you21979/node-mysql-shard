"use strict";
var STATE = {
    READY : 0,
    ACTIVE : 1,
    DONE : 2,
};
var createState = function(event){
    var state = STATE.READY;
    var setState = function(st){
        if(state !== st){
            var old = state;
            state = st;
            event(state, old);
        }
    };
    return {
        active : function(){
            if(state === STATE.READY){
                setState(STATE.ACTIVE);
            }
        },
        done : function(){
            if(state === STATE.ACTIVE){
                setState(STATE.DONE);
            }
        },
        getState : function(){
            return state;
        },
    };
};

/**
 * asyncronus simple task complete checker
 */
var asyncTaskComplete = module.exports = function(){
    var count = 0;
    var callback = function(){};
    var state = createState(function(val, old){
        if(val === STATE.DONE){
            callback();
        }
    });
    return {
        enter : function(){
            if(count === 0){
                state.active();
            }
            ++count;
        },
        leave : function(){
            --count;
            if(count === 0){
                state.done();
            }else if(count < 0){
                throw new Error("BUG : Sync Error");
            }
        },
        join : function(cb){
            callback = cb;
            if(state.getState() === STATE.DONE){
                callback();
            }
        },
    };
}
