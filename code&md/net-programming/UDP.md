# UDP
UDP又称用户数据包协议，与TCP一样同属于网络传输层。UDP与TCP最大的不同是UDP不是面向连接的。TCP中连接一旦建立，所有的会话都基于连接完成，客户端如果要与另一个TCP服务通信，需要另创建一个套接字来完成连接。但在UDP中，一个套接字可以与多个UDP服务通信，它虽然提供面向事务的简单不可靠信息传输服务，在网络差的情况下存在丢包严重的问题，但是由于它无须连接，资源消耗低，处理快速且灵活，所以常常应用在那种偶尔丢一两个数据包也不会产生重大影响的场景，比如音频、视频等。UDP目前应用很广泛，DNS服务即是基于它实现的。
## 创建UDP套接字
创建UDP套接字十分简单，UDP套接字一旦创建，既可以作客户端发送数据，也可以作服务器端接收数据。下面的代码创建了一个UDP套接字：
```javascript
var dgram = require('dgram'); 
var socket = dgram.createSocket("udp4");
```

## 创建UDP服务器端
只要调用dgram.bind(port, [address])方法对端口和网卡绑定即可。
```javascript
var dgram = require("dgram"); 
var server = dgram.createSocket("udp4"); 
server.on("message", function (msg, rinfo) { 
    console.log("server got: " + msg + " from " + 
    rinfo.address + ":" + rinfo.port); 
}); 
server.on("listening", function () { 
    var address = server.address();
    console.log("server listening " + 
        address.address + ":" + address.port); 
}); 
server.bind(41234);
```

## 创建UDP客户端
udp-client.js
当套接字对象用在客户端时，可以调用send（）方法发送消息到网络中。send（）方法的参数如下：
socket.send(buf, offset, length, port, address, [callback])
这些参数分别要发送的Buffer、Buffer的偏移、Buffer的长度、目标端口、目标地址、发送完成后的回调。与TCP套接字的write（）相比，send（）方法的参数列表相对复杂，但是它更灵活的地方在于可以随意发送数据到网络中的服务器端，而TCP如果要发送数据给另一个服务器端，则需要重新通过套接字构造新的连接。

## UDP套接字事件
UDP套接字相对TCP套接字使用起来更简单，它只是一个EventEmitter的实例，而非Stream的实例。它具备如下自定义事件。
口 message：当UDP套接字侦听网卡端口后，接收到消息时触发该事件，触发携带的数据》消息Buffer对象和一个远程地址信息。
口 listening：当UDP套接字开始侦听时触发该事件。
口 close：调用close（）方法时触发该事件，并不再触发message事件。如需再次触发message事件，重新绑定即可。
口 error：当异常发生时触发该事件，如果不侦听，异常将直接抛出，使进程退出。