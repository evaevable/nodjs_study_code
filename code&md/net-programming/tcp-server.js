var net = require('net');

var server = net.createServer(function(socket){
    //新的连接
    socket.on('data', function(data){
        socket.write("你好");
    });

    socket.end('end', function(){
        console.log("连接断开");
    });
    socket.write("欢迎光临");
});

server.listen(41234, function(){
    console.log('server bound');
});