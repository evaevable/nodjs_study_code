process.on('message', function (m, tcp) { 
    if (m === 'server') { 
        tcp.on('connection', function (socket) { 
            server.emit('connection', socket); 
        }); 
    } 
});