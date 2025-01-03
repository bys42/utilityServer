const Router = require("koa-router");
const path = require("path");
const { init, getM3u8, getCurrentInfo } = require("./stream/channel");
const fs = require("fs");

const streamFolder = path.join(__dirname, "../static/stream/");
const tsUrlRoot = "./";

module.exports = {
    getRouter: (config) => {
        const router = new Router();
        let tsErrorCode = false;

        init(streamFolder, tsUrlRoot);

        router.prefix("/stream");

        router.get("/index.m3u8", async (ctx) => {
            ctx.type = "application/vnd.apple.mpegurl";
            ctx.body = await getM3u8();
        });

        router.get("/:programName/:tsFile", async (ctx) => {
            if (tsErrorCode) {
                ctx.status = tsErrorCode;
                return;
            }
            const { programName, tsFile } = ctx.params;
            const filePath = path.join(streamFolder, programName, tsFile);
            ctx.type = "video/MP2T";
            ctx.body = fs.createReadStream(filePath);
        });

        router.get("/config", async (ctx) => {
            tsErrorCode = +ctx.query?.ts_error || 0;
            ctx.body = `tsErrorCode: ${tsErrorCode}`;
        });

        router.get("/info", async (ctx) => {
            ctx.type = "application/json";
            ctx.body = getCurrentInfo();
        });

        return router.routes();
    },
};
