var http = require('http');
var MAX = 100;
var opt = {
    host: 'localhost',
    port: 8080,
    path: '/',
    method: 'GET',
    agent: new http.Agent({maxSockets: MAX})
};
var cur = 0;
function get(count){
    if(cur >= MAX){
        return count;
    }
    var req = http.request(opt, function(res) {
        var data = '';
        res.on('data', function(chunk) {
            data += chunk;
        });
        res.on('end', function() {
            --cur;
            if(count % 1000 === 0)
            console.log(count);
        });
    });
    req.end();
    ++cur;
    return count + 1;
}
var count = 0;
process.nextTick(function T(){
    count = get(count);
    process.nextTick(T);
});
