let express = require("express");
let svgCaptcha = require("svg-captcha");
let bodyParser = require('body-parser')
let path = require("path");
let session = require('express-session')
let app = express();
app.use(bodyParser.urlencoded({
    extended: false
}))
const MongoClient = require('mongodb').MongoClient;


// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'stu';
app.use(express.static('static'));
app.use(session({
    secret: 'keyboard cat',

}))
//路由1,访问登录页面时，直接读取登录页面
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'static/views/login.html'));
})
//路由2
//使用post提交数据过来，验证用户登录
app.post('/login', (req, res) => {
    let userName = req.body.userName;
    let userPass = req.body.userPass;
    let code = req.body.code;
    // console.log(req.body);
    if (code == req.session.captcha) {
        req.session.userInfo = {
            userName,
            userPass
        }
        res.redirect('/index');
    } else {
        res.setHeader("content-type", 'text/html');
        res.send('<script>alert("验证码失败");window.location.href="/login"</script>');
    }
})
//路由3
//生成图片功能，把这个地址设置给登录页的图片的src属性
app.get('/login/captchaImg', (req, res) => {
    var captcha = svgCaptcha.create();
    console.log(captcha.text);
    req.session.captcha = captcha.text.toLocaleLowerCase();
    res.type('svg');
    res.status(200).send(captcha.data);
})
//路由4
//登录首页
app.get('/index', (req, res) => {
    if (req.session.userInfo) {
        res.sendFile(path.join(__dirname, 'static/views/index.html'))
    } else {
        res.setHeader("content-type", 'text/html');
        res.send('<script>alert("请登录");window.location.href="/login"</script>');
    }
})
//路由5，登出操作，删除session的值即可
app.get('/logout', (req, res) => {
    delete req.session.userInfo;
    res.redirect('/login');
})
//路由6展示注册页
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'static/views/register.html'));
})
//路由7,使用post提交注册页
app.post('/register', (req, res) => {
    let userName = req.body.userName;
    let userPass = req.body.userPass;
    // console.log(userName);
    // console.log(userPass);
    MongoClient.connect(url, function (err, client) {


        const db = client.db(dbName);
        let collection = db.collection('studentInfo');
        collection.find({
            userName
        }).toArray((err, doc) => {
            if (doc.length == 0) {
                // 新增数据
                collection.insertOne({
                    userName,
                    userPass
                }, (err, result) => {
                    // console.log(err);
                    // 注册成功了
                    res.setHeader('content-type', 'text/html');
                    res.send("<script>alert('欢迎入坑');window.location='/login'</script>")
                    // 关闭数据库连接即可
                    client.close();
                })
            }
        })

    });
})
app.listen(3000, '127.0.0.1', () => {
    console.log("success");
})