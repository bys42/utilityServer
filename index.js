const Koa = require('koa');
const Router = require('koa-router');

const cors = require('@koa/cors');
const serve = require('koa-static');
const compose = require('koa-compose');

const vastRouter = require("./router/vast")
const trackingRouter = require("./router/tracking")

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

// 啟動服務器
const port = 3060;
app.listen(port, () => {
    console.log(`服務器運行在 http://localhost:${port}`);
});