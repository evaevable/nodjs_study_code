# Buffer结构
buffer是一个js和c++结合的模块，性能部分由c++实现，非性能由js实现。
buffer过于常见，node在进程启动时候就加载了它，并放在了global中，所以不需要require。

## Buffer对象
Buffer对象类似于数组，16进制的两位数，即0到255。
```javascript
var str = "node.js"; 
var buf = new Buffer(str, 'utf-8'); 
console.log(buf);
// => <Buffer e6 b7 b1 e5 85 a5 e6 b5 85 e5 87 ba 6e 6f 64 65 2e 6a 73>
```
Buffer收到Array影响大，可以用length访问长度，也可以通过下标访问对象。
```javascript
var buf = new Buffer(100); 
console.log(buf.length); // => 100
```

```javascript
buf[20] = -100; 
console.log(buf[20]); // 156 
buf[21] = 300; 
console.log(buf[21]); // 44 
buf[22] = 3.1415; 
console.log(buf[22]); // 3
```
如果赋值元素小于0，则加n个256 得到一个存在于0～255的整数，大于255的就减n个256，得到在区间内的整数，小数的话舍弃小数部分，只保留整数。

## Buffer内存分配
Buffer对象的内存分配不是在V8的堆内存中，而是在Node的C++层面实现内存的申请的。因处理大量的字节数据不能采用需要一点内存就向操作系统申请一点内存的方式，这可能造成大量的内存申请的系统调用，对操作系统有一定压力。此Node在内存的使用上应用的是在C++层面申请内存、在JavaScript中分配内存的策略。
为了高效地使用申请来的内存，Node采用了slab分配机制。slab是一种动态内存管理机制，最早诞生于SunOS操作系统（Solaris）中，目前在一些*nix操作系统中有广泛的应用，如FreeBSD和Linux。
简单而言，slab就是一块申请好的固定大小的内存区域。slab具有如下3种状态。
口 full：完全分配状态。
口 partial：部分分配状态。
口 empty：没有被分配状态。

当我们需要一个Buffer对象，可以通过以下方式分配指定大小的Buffer对象：
new Buffer(size);
Node以8 KB为界限来区分Buffer是大对象还是小对象：
Buffer.poolSize = 8 * 1024;
这个8KB的值也就是每个slab的大小值，在JavaScript层面，以它作单位单元进行内存的分配。