const EventEmitter = require('events').EventEmitter;
const util = require('util');

var Promise = function(){
    EventEmitter.call(this);
};
util.inherits(Promise,EventEmitter);

Promise.prototype.then = function(fulfilledHandler, errorHandler, progressHandler){
    if(typeof fulfilledHandler === 'function'){
        // 利用once()方法，保证成功回调至执行一次
        this.once('success', fulfilledHandler);
    }
    if(typeof errorHandler === 'function'){
        this.once('error', errorHandler);
    }
    if(typeof progressHandler === 'function'){
        this.on('progress', progressHandler);
    }
    return this;
};

//延迟对象
var Deferred = function(){
    this.state = 'unfulfilled';
    this.promise = new Promise();
}

Deferred.prototype.resolve = function(obj){
    this.state = 'fulfilled';
    this.promise.emit('success', obj);
}

Deferred.prototype.reject = function(obj){
    this.state = 'failed';
    this.promise.emit('error', obj);
}

Deferred.prototype.progress = function(data){
    this.promise.emit('progress', data);
}

// 对一个典型的响应对象进行封装
res.setEncoding('utf8'); 
res.on('data', function (chunk) { 
    console.log('BODY: ' + chunk); 
}); 
res.on('end', function () { 
    // Done
}); 
res.on('error', function (err) { 
    // Error
});
//上述可简写为
res.then(function () { 
    // Done
   }, function (err) { 
    // Error
   }, function (chunk) { 
    console.log('BODY: ' + chunk); 
});

var promisify = function(res){
    var deferred = new Deferred();
    var result = '';
    res.on('data', function(chunk){
        result += chunk;
        deferred.progress(chunk);
    });
    res.on('end', function(){
        deferred.resolve(result);
    });
    res.on('error', function(err){
        deferred.reject(err)
    });
    return deferred.promise;
}

// // 示例用法
// var promise = new Promise();

// promise.then(
//     function(result) {
//         console.log('Fulfilled with:', result);
//     },
//     function(error) {
//         console.error('Rejected with:', error);
//     },
//     function(progress) {
//         console.log('Progress:', progress);
//     }
// );

// // 模拟异步操作
// setTimeout(() => promise.emit('success', 'some result'), 1000);
// setTimeout(() => promise.emit('progress', '50% done'), 500);