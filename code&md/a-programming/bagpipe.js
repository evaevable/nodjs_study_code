var Bagpipe = require('bagpipe'); 
// 设置并发数为10
var bagpipe = new Bagpipe(10); 
for (var i = 0; i < 100; i++) { 
 bagpipe.push(async, function () { 
 // 异步回调执行
 }); 
} 
bagpipe.on('full', function (length) { 
 console.warn('os can‘t done, queue length:' + length); 
});


/** 
 * 推入方法，参数，最后一个参数为回调函数
 * @param {Function} method 异步方法
 * @param {Mix} args 参数列表，最后一个参数为回调函数
 */ 
Bagpipe.prototype.push = function (method) { 
    var args = [].slice.call(arguments, 1); 
    var callback = args[args.length - 1]; 
    if (typeof callback !== 'function') { 
        args.push(function () {}); 
    } 
    if (this.options.disabled || this.limit < 1) { 
        method.apply(null, args); 
        return this; 
    } 
    // 队列长度超过限制时
    if (this.queue.length < this.queueLength || !this.options.refuse) { 
        this.queue.push({ 
        method: method, 
        args: args 
    }); 
    } else { 
        var err = new Error('Too much async call in queue'); 
        err.name = 'TooMuchAsyncCallError'; 
        callback(err); 
    } 
    if (this.queue.length > 1) { 
        this.emit('full', this.queue.length); 
    }
    this.next();
    return this;
}

/*! 
 * 继续执行队列中的后续动作
 */ 
Bagpipe.prototype.next = function () { 
    var that = this; 
    if (that.active < that.limit && that.queue.length) { 
        var req = that.queue.shift(); 
        that.run(req.method, req.args); 
    } 
};

/*! 
 * 执行队列中的方法
 */ 
Bagpipe.prototype.run = function (method, args) { 
    var that = this; 
    that.active++; 
    var callback = args[args.length - 1]; 
    var timer = null; 
    var called = false; 

    // inject logic 
    args[args.length - 1] = function (err) { 
        // anyway, clear the timer 
        if (timer) { 
            clearTimeout(timer); 
            timer = null; 
        } 
        // if timeout, don't execute 
        if (!called) { 
            that._next(); 
            callback.apply(null, arguments); 
        } else { 
            // pass the outdated error 
            if (err) { 
                that.emit('outdated', err); 
            } 
        } 
    }; 
    var timeout = that.options.timeout; 
    if (timeout) { 
        timer = setTimeout(function () { 
            // set called as true
            called = true; 
            that._next(); 
            // pass the exception 
            var err = new Error(timeout + 'ms timeout'); 
            err.name = 'BagpipeTimeoutError'; 
            err.data = { 
                name: method.name, 
                method: method.toString(), 
                args: args.slice(0, -1) 
            }; 
            callback(err); 
        }, timeout); 
    } 
    method.apply(null, args); 
};