import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { sql, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { documents_table } from '../db/schema.js';
import { redis } from '../redis.js';
import { json_content, json_error } from './index.js';
const search_route = createRoute({
    method: 'get',
    path: '/',
    summary: 'Search documents',
    request: {
        query: z.object({
            q: z.string().min(1).openapi({
                param: { name: 'q', in: 'query' },
                example: 'postgres search',
            }),
        }),
    },
    responses: {
        200: json_content(z.object({
            results: z.array(z.object({
                id: z.number(),
                title: z.string(),
                url: z.string(),
                content_snippet: z.string(),
                created_at: z.string(),
            })),
            cached: z.boolean(),
        }), 'Search results'),
        400: json_error('Invalid payload properties or parameters'),
        401: json_error('Expired or invalid session token'),
        500: json_error('Internal application database crash'),
    },
});
const app = new OpenAPIHono();
app.openapi(search_route, async (c) => {
    try {
        const { q } = c.req.valid('query');
        const cache_key = `search:${q.toLowerCase().trim()}`;
        // 1. Check Redis Cache
        const cached_data = await redis.get(cache_key);
        if (cached_data) {
            return c.json({ results: JSON.parse(cached_data), cached: true }, 200);
        }
        // 2. Perform Postgres Full-Text Search
        const search_vector = sql `to_tsvector('english', ${documents_table.title} || ' ' || ${documents_table.content})`;
        const search_query = sql `plainto_tsquery('english', ${q})`;
        // Calculate rank
        const rank = sql `ts_rank(${search_vector}, ${search_query})`;
        const results = await db
            .select({
            id: documents_table.id,
            title: documents_table.title,
            url: documents_table.url,
            // Optional snippet of content
            content_snippet: sql `substring(${documents_table.content} from 1 for 200)`,
            created_at: documents_table.created_at,
        })
            .from(documents_table)
            .where(sql `${search_vector} @@ ${search_query}`)
            .orderBy(desc(rank))
            .limit(20);
        // Format the results before caching
        const formatted_results = results.map(r => ({
            ...r,
            created_at: r.created_at.toISOString()
        }));
        // 3. Cache results in Redis for 5 minutes (300 seconds)
        await redis.set(cache_key, JSON.stringify(formatted_results), 'EX', 300);
        return c.json({ results: formatted_results, cached: false }, 200);
    }
    catch (error) {
        console.error('Search error:', error);
        return c.json({ error: error.message || 'Internal server error' }, 500);
    }
});
export default app;
