const EventProxy = require('eventproxy')

exports.getContent = function(callback) {
    var ep = new EventProxy();
    ep.all('tql', 'data', function(tql, data){
        //成功回调
        callback(null, {
            template: tpl,
            data: data
        });
    });
    //绑定错误处理函数
    ep.fail(callback);
    fs.readFile('template.tpl', 'utf-8', ep.done('tpl'));
    db.get('some sql', ep.done('data'));
}