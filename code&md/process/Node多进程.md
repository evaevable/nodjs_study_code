# 多进程架构
Node中提供了Child_process模块，并且可以利用child_process.fork()去实现进程的复制

## 创建子进程
child_process模块给予Node可以随意创建子进程（child_process）的能力。它提供了4个方法用于创建子进程。
口 spawn（）：启动一个子进程来执行命令。
口 exec（）：启动一个子进程来执行命令，与spawn（）不同的是其接口不同，它有一个回调函数获知子进程的状况。
口 execFile（）：启动一个子进程来执行可执行文件。
口 fork（）：与spawn（）类似，不同点在于它创建Node的子进程只需指定要执行的JavaScript文件模块即可。
spawn（）与exec（）、execFile（）不同的是，后两者创建时可以指定timeout属性设置超时时间，一旦创建的进程运行超过设定的时间将会被杀死。
exec（）与execFile（）不同的是，exec（）适合执行已有的命令，execFile（）适合执行文件。这里我们以一个寻常命令例，node worker.js分别用上述4种方法实现，如下所示：
```javascript
var cp = require('child_process'); 
cp.spawn('node', ['worker.js']); 
cp.exec('node worker.js', function (err, stdout, stderr) { 
    // some code 
}); 
cp.execFile('worker.js', function (err, stdout, stderr) { 
    // some code 
}); 
cp.fork('./worker.js');
```

尽管4中创建方法有些差别，但其他三种都是spwan()方法的延伸使用

## 进程间通信

```javascript
// 浏览器HTML5中的做法
var worker = new Worker('worker.js'); 
worker.onmessage = function (event) { 
    document.getElementById('result').textContent = event.data; 
}; 
其中，worker.js如下所示
var n = 1; 
search: while (true) { 
    n += 1; 
    for (var i = 2; i <= Math.sqrt(n); i += 1) 
    if (n i == 0) %
        continue search; 
    // found a prime 
    postMessage(n); 
}
```
主线程与工作线程之间通过onmessage（）和postMessage（）进行通信，子进程对象则由send（）方法实现主进程向子进程发送数据，message事件实现收听子进程发来的数据，与API在一定程度上相似。通过消息传递内容，而不是共享或直接操作相关资源，这是较轻量和无依赖的做法。

```javascript
// Node中的做法
// parent.js 
var cp = require('child_process'); 
var n = cp.fork(__dirname + '/sub.js'); 
n.on('message', function (m) { 
    console.log('PARENT got message:', m); 
}); 
n.send({hello: 'world'}); 
// sub.js
process.on('message', function (m) { 
    console.log('CHILD got message:', m); 
}); 
process.send({foo: 'bar'});
```
通过fork（）或者其他API，创建子进程之后，为了实现父子进程之间的通信，父进程与子进程之间将会创建IPC通道。通过IPC通道，父子进程之间才能通过message和send（）传递消息。

父进程在实际创建子进程之前，会创建IPC通道并监听它，然后才真正创建出子进程，并通过环境变量（NODE_CHANNEL_FD）告诉子进程这个IPC通道的文件描述符。子进程在启动的过程中，根据文件描述符去连接这个已存在的IPC通道，从而完成父子进程之间的连接。

## 句柄传递
Node在版本v0.5.9引入了进程间发送句柄的功能。send（）方法除了能通过IPC发送数据外，还能发送句柄，第二个可选参数就是句柄，如下所示：
child.send(message，[sendandle])
那什么是句柄？句柄是一种可以用来标识资源的引用，它的内部包含了指向对象的文件描述符。比如句柄可以用来标识一个服务器端socket对象、一个客户端socket对象、一个UDP套接字、一个管道等。
发送句柄意味着什么？我们可以去掉代理这种方案，使主进程接收到socket请求后，将这个socket直接发送给工作进程，而不是重新与工作进程之间建立新的socket连接来转发数据。文件描述符浪费的问题可以通过这样的方式轻松解决。来看看我们的示例代码。
```javascript
// 主进程
var child = require('child_process').fork('child.js'); 
// Open up the server object and send the handle 
var server = require('net').createServer(); 
server.on('connection', function (socket) { 
    socket.end('handled by parent\n'); 
}); 
server.listen(1337, function () { 
    child.send('server', server); 
}); 

// 子进程
process.on('message', function (m, server) { 
    if (m === 'server') { 
        server.on('connection', function (socket) { 
        socket.end('handled by child\n'); 
    }); 
 } 
});
```

## 进程事件
再次回归到子进程对象上，除了引人关注的send（）方法和message事件外，子进程还有些什么呢？首先除了message事件外，Node还有如下这些事件。
口 error：当子进程无法被复制创建、无法被杀死、无法发送消息时会触发该事件。
口 exit：子进程退出时触发该事件，子进程如果是正常退出，这个事件的第一个参数退出码，否则null。如果进程是通过kill（）方法被杀死的，会得到第二个参数，它表示杀死进程时的信号。
口 close：在子进程的标准输入输出流中止时触发该事件，参数与exit相同。
口 disconnect：在父进程或子进程中调用disconnect（）方法时触发该事件，在调用该方法时将关闭监听IPC通道。
上述这些事件是父进程能监听到的与子进程相关的事件。除了send（）外，还能通过kill（）方法给子进程发送消息。kill（）方法并不能真正地将通过IPC相连的子进程杀死，它只是给子进程发送了一个系统信号。默认情况下，父进程将通过kill（）方法给子进程发送一个SIGTERM信号。它与进程默认的kill（）方法类似