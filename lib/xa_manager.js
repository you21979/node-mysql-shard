var asyncTask = require("../lib/async_task_complete");
var XAManager = module.exports = function(){
    this._q = [];
}
XAManager.prototype.add = function(xaq){
    this._q.push(xaq);
}
XAManager.prototype.prepare = function(callback){
    var task = asyncTask();
    this._q.forEach(function(v){
        task.enter();
        var id = v.getId();
        v.prepare(function(err, val){
            task.setResult(id,err);
            task.leave();
        });
    });
    var self = this;
    task.join(function(){
        var ret = true;
        self._q.forEach(function(v){
            var err = task.getResult(v.getId());
            if(err){
                console.log(err);
                ret = false;
            }
        });
        callback(ret);
    });
}
XAManager.prototype.commit = function(callback){
    var task = asyncTask();
    this._q.forEach(function(v){
        task.enter();
        var id = v.getId();
        v.commit(function(err, val){
            task.setResult(id,err);
            task.leave();
        });
    });
    var self = this;
    task.join(function(){
        var ret = true;
        self._q.forEach(function(v){
            var err = task.getResult(v.getId());
            if(err){
                console.log(err);
                ret = false;
            }
        });
        callback(ret);
    });
}
XAManager.prototype.quit = function(){
    this._q.forEach(function(v){
        v.quit();
    });
}

