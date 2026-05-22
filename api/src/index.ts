import { serve } from '@hono/node-server'
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { cors } from 'hono/cors'

const app = new OpenAPIHono();
app.use("*", cors());

const Test = z.object({
	test: z.string()
});

const TestRoute = createRoute({
	method: 'get',
	path: '/test',
	responses: {
		200: {
			content: {
				'application/json': {
					schema: Test,
				}
			},
			description: 'Test',
		}
	}
});

app.openapi(TestRoute, (c) => {
	return c.json({
		test: 'hello'
	});
});

app.doc('/openapi.json', {
	openapi: '3.0.0',
	info: {
		version: process.env.API_VERSION || "1.0.0",
		title: 'spider api'
	}
});

serve({
	fetch: app.fetch,
	port: parseInt(process.env.API_PORT || "5000")
}, (info) => {
	console.log(`Server is running on http://localhost:${info.port}`);
})
