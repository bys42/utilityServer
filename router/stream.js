const Router = require("koa-router");
const { init, getM3u8, getCurrentInfo } = require("./stream/channel");

module.exports = {
    getRouter: (config) => {
        const router = new Router();
        init();

        router.prefix("/stream");

        router.get("/test.m3u8", async (ctx) => {
            ctx.type = "application/vnd.apple.mpegurl";
            ctx.body = await getM3u8();
        });

        router.get("/debug", async (ctx) => {
            ctx.type = "application/json";
            ctx.body = getCurrentInfo();
        });

        router.get("/set_error", async (ctx) => {});

        return router.routes();
    },
};
