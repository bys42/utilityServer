const Koa = require('koa');
const Router = require('koa-router');
const https = require("https");
const http = require("http");
const path = require('path');
const fs = require('fs')

const cors = require('@koa/cors');
const serve = require('koa-static');
const compose = require('koa-compose');

const vastRouter = require("./router/vast")
const trackingRouter = require("./router/tracking");

const app = new Koa();

app.use(cors());

const mainRouter = new Router();// 路由
mainRouter.get('/', async (ctx) => {
    ctx.body = {
        message: '歡迎使用 Koa2!'
    };
});
app.use(mainRouter.routes()).use(mainRouter.allowedMethods());

app.use(compose([vastRouter.getRouter(), trackingRouter.getRouter()]))

// 錯誤處理 
app.on('error', (err, ctx) => {
    console.error('服務器錯誤', err);
});

app.use(serve("./static"))

const config = {
    http: {
        port: 3060,
    },
    https: {
        port: 3080,
        options: {
            key: fs.readFileSync(path.resolve(process.cwd(), 'certs/server.key'), 'utf8').toString(),
            cert: fs.readFileSync(path.resolve(process.cwd(), 'certs/server.crt'), 'utf8').toString(),
        },
    },
};

const serverCallback = app.callback();
http.createServer(serverCallback).listen(config.http.port);
https.createServer(config.https.options, serverCallback).listen(config.https.port);
