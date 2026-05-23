import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { json_content, json_error } from './index.js';
const app = new OpenAPIHono();
const test_route = createRoute({
    method: 'get',
    path: '/a',
    responses: {
        200: json_content(z.object({ test: z.string() }), 'Successful fetch data payload'),
        400: json_error('Invalid payload properties or parameters'),
        401: json_error('Expired or invalid session token'),
        500: json_error('Internal application database crash'),
    },
});
app.openapi(test_route, (c) => {
    const isUnauthorized = true;
    if (isUnauthorized) {
        return c.json({
            error: 'test',
        }, 401);
    }
    return c.json({
        test: 'hello',
    }, 200);
});
export default app;
