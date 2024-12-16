const Router = require('koa-router');

module.exports = {
    getRouter: (config) => {
        const router = new Router();

        router.prefix('/tracking')

        router.get('/:anything', async (ctx) => {
            let message = decodeURIComponent(ctx.params.anything)
            try {
                message = JSON.parse(message)
            } catch (error) {
            }
            console.log(message)
            ctx.status = 200
            ctx.body = "ok"
        });

        return router.routes();
    }
}