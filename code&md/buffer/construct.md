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

真正的内存是在Node的C++层面提供的，JavaScript层面只是使用它。当进行小而频繁的Buffer操作时，采用slab的机制进行预先申请和事后分配，使得JavaScript到操作系统之间不必有过多的内存申请方面的系统调用。对于大块的Buffer而言，则直接使用C++层面提供的内存，而无需细腻的分配操作。

## Buffer转换
### 字符串转Buffer
字符串转Buffer主要是通过构造方法完成的：
new Buffer(str, [encoding]); // encoding 默认为utf-8
一个Buffer还可以存储不同编码类型的字符串转码的值，用的是它的write()方法：
buf.write(string, [offset], [length], [encoding])

### Buffer转字符串
buf.toString([encoding], [start], [end])

### Buffer不支持的编码类型
通过这个方法来判断是否支持转换：
Buffer.isEncoding(encoding) 
一些不支持的可以通过借助一些模块进行完成。比如iconv和iconv-lite
以下是iconv-lite的代码：
```javascript
var iconv = require('iconv-lite'); 
// Buffer转字符串
var str = iconv.decode(buf, 'win1251');
// 字符串转Buffer
var buf = iconv.encode("Sample input string", 'win1251');
```
## Buffer拼接
Buffer通常是一段一段方式传递的：
```javascript
var fs = require('fs'); 
var rs = fs.createReadStream('test.md'); 
var data = ''; 
rs.on("data", function (chunk){ 
    data += chunk; 
}); 
rs.on("end", function () { 
    console.log(data); 
});
```
上面这段代码，用于流读取的示范，data事件中获取的chunk对象即是Buffer对象。
对于初学者而言，容易将Buffer当做字符串来理解，所以在接受上面的示例时不会觉得有任何异常。
一旦输入流中有宽字节编码时，问题就会暴露出来。如果你在通过Node开发的网站上看到 ? 乱码符号，那么该问题的起源多半来自于这里。
这里潜藏的问题在于如下这句代码：
    data += chunk;
这句代码里隐藏了tostring()操作，它等价于如下的代码：
    data = data.tostring()+ chunk.tostring();
这种场景下，对于宽子节的中文，会形成问题

### 乱码如何产生的
<Buffer e5 ba 8a e5 89 8d e6 98 8e e6 9c>
<Butter 88 e5 85 89 et bc 8c e7 96 91 e6>
...
上文提到的buf.tostrin()方法默认以UTF-8为编码，中文字在UTF-8下占3个字节。
所以第一个Buffer对象在输出时，只能显示3个字符，Buffer中剩下的2个字节（e6 gc）将会以乱码的形式显示。
第二个Buffer对象的第一个字节也不能形成文字，只能显示乱码。于是形成一些文字无法正常显示的问题。
对于任意长度的Buffer而言，宽字节字符串都有可能存在被截断的情况，只不过Buffer的长度越大出现的概率越低而已。

### setEncoding() & string_decoder()
readable.setEncoding(encoding)
他的作用就是让传递的不再是一个Buffer对象，而是编码后的字符串

要知道，无论如何设置编码，触发data事件的次数依旧相同，这意味着设置编码并未改变按段读取的基本方式。
事实上，在调用setEncoding()时，可读流对象在内部设置了一个decoder对象。每次data事件都通过该decoder对象进行Buffer到字符串的解码，然后传递给调用者。是故设置编码后，data不再收到原始的Buffer对象。但是这依旧无法解释何设置编码后乱码问题被解决掉了，因为在前述分析中，无论如何转码，总是存在宽字节字符串被截断的问题。
最终乱码问题得以解决，还是在于decoder的神奇之处。decoder对象来自于string_decoder模块StringDecoder的实例对象。它神奇的原理是什么，下面我们以代码来说明：
```javascript
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder ('utf8');
var buf1 = new Buffer([oxE5, OX, OX8, OXE5, 0X89, OX8D, OXE6, 0x98, 0X8E, 0хЕ6, 0x90]);
console.1og（decoder.write（buf1））；
//=>床前明
var buf2 = new Buffer([0x88, OX5, 0X85, 0X89, OXEF, ОХВС, OX8, OX7, 0x96, 0x91, 0x61);
console.log(decoder.write(buf2));
11=>月光，疑
```
我将前文提到的前两个Buffer对象写入decoder中。奇怪的地方在于“月”的转码并没有如平常一样在两个部分分开输出。StringDecoder在得到编码后，知道宽字节字符串在UTF-8编码下是以3个字节的方式存储的，所以第一次write（）时，只输出前9个字节转码形成的字符，“月”字的前两个字节被保留在StringDecoder实例内部。第二次write（）时，会将这2个剩余字节和后续11个字节组合在一起，再次用3的整数倍字节进行转码。于是乱码问题通过这种中间形式被解决了。
虽然string_decoder模块很奇妙，但是它也并非万能药，它目前只能处理UTF-8、Base64和UCS-2/UTF-16LE这3种编码。所以，通过setEncoding（）的方式不可否认能解决大部分的乱码问题，但并不能从根本上解决该问题。

### 正确拼接Buffer
```javascript
var chunks = []; 
var size = 0; 
res.on('data', function (chunk) { 
    chunks.push(chunk); 
    size += chunk.length; 
}); 
res.on('end', function () {
    var buf = Buffer.concat(chunks, size); 
    var str = iconv.decode(buf, 'utf8'); 
    console.log(str); 
});
```
正确的拼接方式应该是用一个数组来存储接收到的所有的Buffer片段，并记录下所有片段的总长度，然后调用Buffer.concat()方法生成一个合并的Buffer对象。
Buffer.concat()
```javascript
Buffer.concat = function(list, length) { 
    if (!Array.isArray(list)) { 
        throw new Error('Usage: Buffer.concat(list, [length])'); 
    } 
    if (list.length === 0) { 
        return new Buffer(0); 
    } else if (list.length === 1) { 
        return list[0]; 
    } 
    if (typeof length !== 'number') { 
        length = 0; 
        for (var i = 0; i < list.length; i++) { 
            var buf = list[i]; 
            length += buf.length; 
        } 
    } 
    var buffer = new Buffer(length); 
    var pos = 0; 
    for (var i = 0; i < list.length; i++) { 
        var buf = list[i]; 
        buf.copy(buffer, pos); 
        pos += buf.length; 
    } 
    return buffer; 
};
```

## Buffer性能
高！