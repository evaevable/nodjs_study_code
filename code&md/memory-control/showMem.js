// 查看内存使用情况
// 格式化输出内容
var showMem = function () { 
    var mem = process.memoryUsage(); 
    var format = function (bytes) { 
        return (bytes / 1024 / 1024).toFixed(2) + ' MB'; 
    }; 
    console.log('Process: heapTotal ' + format(mem.heapTotal) + 
    ' heapUsed ' + format(mem.heapUsed) + ' rss ' + format(mem.rss)); 
    console.log('-----------------------------------------------------------'); 
};

// Array
var useMem = function () { 
    var size = 20 * 1024 * 1024; 
    var arr = new Array(size); 
    for (var i = 0; i < size; i++) { 
        arr[i] = 0; 
    } 
    return arr; 
}; 

// Buffer
var useMem = function () { 
    var size = 200 * 1024 * 1024; 
    var buffer = new Buffer(size); 
    for (var i = 0; i < size; i++) { 
        buffer[i] = 0; 
    } 
    return buffer; 
};

var total = []; 
for (var j = 0; j < 15; j++) { 
    showMem(); 
    total.push(useMem()); 
} 
showMem();

// 总结 node的内存构成主要由通过V8进行分配的部分和Node自行分配的部分。受V8的垃圾回收限制的主要是V8的堆内存