const Router = require('koa-router')
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    getRouter: () => {
        const router = new Router()
        router.prefix('/vast')

        router.get('/:id', async (ctx) => {
            try {
                const { id } = ctx.params;
                const filePath = path.join(__dirname, '../static/vast', `${id}.xml`);
                const xmlContent = await fs.readFile(filePath, 'utf-8');
                ctx.type = 'application/xml';
                ctx.body = xmlContent;

            } catch (error) {
                console.error('讀取文件錯誤:', error);

                if (error.code === 'ENOENT') {
                    ctx.status = 404;
                    ctx.body = {
                        error: '找不到指定的 VAST 文件'
                    };
                    return;
                }

                ctx.status = 500;
                ctx.body = {
                    error: '服務器內部錯誤'
                };
            }
        })

        return router.routes()
    }
}