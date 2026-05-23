import { serve } from '@hono/node-server';
import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from 'hono/cors';
import search_routes from './routes/search.js';
const app = new OpenAPIHono();
app.use("*", cors());
app.route("/search", search_routes);
app.doc('/openapi.json', {
    openapi: '3.0.0',
    info: {
        version: process.env.API_VERSION || "1.0.0",
        title: 'spider api'
    }
});
app.get('/docs', Scalar({
    url: "/openapi.json",
    pageTitle: "spider api",
}));
app.onError((err, c) => {
    return c.json({
        error: err.message,
    }, 500);
});
serve({
    fetch: app.fetch,
    port: parseInt(process.env.API_PORT || '3000')
}, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
});
