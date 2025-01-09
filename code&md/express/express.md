# 什么是 Express
官方概念:Express 是基于 Node,js 平台，快速、开放、极简的 Web 开发框架,
通俗理解:Express 的作用和 Node.js 内置的 http 模块类似，是专门用来创建 Web 服务器的。

创建基本的 Web 服务器

```javascript
// 1.导入 express
 const express = require('express');
// 2.创建 web 服务器
 const app = express();
 
  // 4.监听客户端的 GET 和 POST 请求，并向客户端响应具体的内容
  app.get('/user',(req, res)=>{
	// 调用 express 提供的 res.send()方法，向客户端响应一个 JSON 对象
	res.send({ name:'zs',age:20,gender:'男’));
  });
  app.post('/user',(req, res)=>{
 	 //req.query 默认是一个空对象
	//客户端使用 ?name=zs&age=20 这种查询字符串形式，发送到服务器的参数，
	//可以通过 req.query 对象访问到，例如:
	// req.query.namereq.query.age
	console.log(req.query);
	// 调用 express 提供的 res.send()方法，向客户端响应一个 文本字符串
	
	res.send('请求成功');
 });
 
// URL 地址中，可以通过:参数名可以任意取，匹都动态参数值
 app.get('/user/:id',(req, res)=> {
  //req.params 默认是一个空对象
  //里面存放着通过:动态匹配到的参数值
	console.log(req.params);
}) 
 //3.调用 app.listen(端口号，启动成功后的回调函数)，启动服务器
  app.listen(80,()=>{
	console.log('express server running at http://127.0.0.1');
  });
```

## express.static()
express 提供了一个非常好用的函数，叫做 express.static0，通过它，我们可以非常方便地创建一个静态资源服务器例如，通过如下代码就可以将 public 目录下的图片、CSS 文件、JavaScript 文件对外开放访问了:

```javascript
app.use(express.static('public'));
```

现在，你就可以访问 public 目录中的所有文件了:
http://localhost:3000/images/bg.jpg
http://localhost:3000/css/style.css
http://localhost:3000/jis/login.js

注意: Express 在指定的静态目录中查找文件，并对外提供资源的访问路径，因此，存放静态文件的目录名不会出现在 URL 中。
如果要托管多个静态资源目录，请多次调用 express.static0 函数:
访问静态资源文件时，express.static0 函数会根据目录的添加顺序查找所需的文件.

如果希望在托管的静态资源访问路径之前，挂载路径前级，则可以使用如下的方式:

app.use("/public", express.static("public"))

现在，你就可以通过带有 /public 前缀地址来访问 public 目录中的文件了:
http://localhost:3000/public/images/kitten,jpg
http://localhost:3000/public/css/style.css
http://localhost:3000/public/js/app.js

## 路由

在 Express 中，路由指的是客户端的请求与服务器处理函数之间的映射关系,Express 中的路由分3部分组成，分别是请求的类型、请求的 URL 地址、处理函数，格式如下:

app.METHOD(PATH, HANDLER)

试用例子如上面的get, post 请求

### 模块化路由
为了方便对路由进行模块化的管理，Express 不建议将路由直接挂载到 app 上，而是推荐将路由抽离为单独的模块将路由抽离为单独模块的步骤如下:
① 创建路由模块对应的 .js 文件
② 调用 express.Router0 函数创建路由对象
③ 向路由对象上挂载具体的路由
④ 使用 module.exports 向外共享路由对象
⑤ 使用 app.use0 函数注册路由模块

```javascript
// 这是路由模块
// 1.导入 express
const express = require('express');
// 2.创建路由对象
const router = express.Router();
// 3.挂载具体的路由
router.get('/user/list',(req, res)=>{res.send('Get user list.'));
router.post('/user/add',(req, res)=>{res.send('Add new user.')};
// 4.向外导出路由对象
module.exports = router;

```
在app.js 引入上面router

```javascript 
const express = require('express')6const app = express();
// 1.导入路由模块
const router = require('./router');//2.注册路由模块
// app.use(router)
// 使用 app.use()注册路由模块，并添加统一的访问前缀 api
app.use('/i', userRouter);

app.listen(80,()=>{
	console.log('http://127.8.0.1');
2)

```

## 中间件
next 函数是实现多个中间件连续调用的关键，它表示把流转关系转交给下一个中间件或路由。

```javascript
// 定义一个最简单的中间件函数
const mw = function(req, res, next){
	console.1og("这是最简单的中间件函数");
	// 把流转关系，转交给下一个中问件或路由
	next();
}
```

### 全局生效的中间件

客户端发起的任何请求，到达服务器之后，都会触发的中间件，叫做全局生效的中间件通过调用 app.use(中间件函数)，即可定义一个全局生效的中间件，示例代码如下:
```javascript
// 常量 m 所指向的，就是一个中间件的效
const mw = function(reg, res, next){
	console.10g("这是一个最简单的中间件园数");
	next();
  }
 //全局生效的中间件
 app.use(mw);

```

### 中间件的作用
多个中间件之间，共享同一份 req 和 res。基于这样的特性，我们可以在上游的中间件中，统一为 req 或 res 对象添加自定义的属性或方法，供下游的中间件或路由进行便用。

### 局部中间件
```javascript
// 1.定义中间件函数
const mw1 =(req, res, next)=>{
	console.log('调用了局部生效的中间件");
    next();
}
// 2.创建路由  局部中间件
app.get('/'，mw1,(req, res)=>{
	res.send('Home page.');
J)
app.get('/user',(req,res)=>{
	res.send('User page.");
})

```

### 了解中间件的5个使用注意事项

一定要在路由之前注册中间件
客户端发送过来的请求，可以连续调用多个中间件进行处理
执行完中间件的业务代码之后，不要忘记调用 next()函数
为了防止代码逻辑混乱，调用 next0函数后不要再写额外的代码
连续调用多个中间件时，多个中间件之间，共享req 和res 对象

### Express 官方把常见的中间件用法，分成了5大类，分别是

1. 应用级别的中间件
绑定到api实例上的中间件，叫做应用级别的中间件
2. 路由级别的中间件
绑定到 express.Router()实例上的中间件，叫做路由级别的中间件。它的用法和应用级别中间件没有任何区别。只不过，应用级别中间件是绑定到 app 实例上，路由级别中间件绑定到 router 实例上，
3. 错误级别的中间件
错误级别中间件的作用:专门用来捕获整个项目中发生的异常错误，从而防止项目异常崩溃的问题，格式:错误级别中间件的 function 处理函数中，必须有4个形参，形参顺序从前到后，分别是(err,req,res,next), 错误中间件一定放所有路由的后面。
4. Express 内置的中间件
5. 第三方的中间件

## CORS 跨域资源共享
接口的跨域问题
编写的 GET和 POST接口，存在一个很严重的问题:不支持跨域请求解决接口跨域问题的方案主要有两种:
    CORS(主流的解决方案，推荐使用)
    JSONP(有缺陷的解决方案:只支持 GET请求)

### 什么是 CORS
CORS (Cross-Origin Resource Sharing跨域资源共享)由一系列 HTTP 响应头组成，这些 HTTP 响应头决定CORS浏览器是否阻止前端 JS 代码跨域获取资源。
浏览器的同源安全策略默认会阻止网页“跨域”获取资源。但如果接口服务器配置了 CORS 相关的 HTTP 响应头就可以解除浏览器端的跨域访问限制。

### 使用 cors 中间件解决跨域问题
cors 是 Express 的一个第三方中间件。通过安装和配置 cors 中间件，可以很方便地解决跨域问题
使用步器分为如下3步:

运行 npm install cors 安装中间件
使用 const cors = require('cors’)导入中间件
在路由之前调用 app.use(cors) 配置中间件

CORS 响应头部-Access-Control-Allow-Origin
响应头部中可以携带一个 Access-Control-Allow-Origin 字段，其语法如下:

Access-Control-Allow-0rigin: <origin> | *

其中，origin 参数的值指定了允许访问该资源的外域 URL。

// 例如，下面的字段值将只允许来自 http://abcde.cn 的请求:
res.setHeader('Access-Control-Allow-0rigin', "http://abcde.cn');
// 如果指定了 Access-Control-Allow-Origin 字段的值为通配符*，表示允许来自任何域的请求，示例代码如下:
res.setHeader('Access-control-Allow-0rigin', '*');