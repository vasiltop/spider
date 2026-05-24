import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { documents_table } from '../db/schema.js';
import { redis } from '../redis.js';
import { json_content, json_error } from './index.js';

const app = new OpenAPIHono();

const seed_route = createRoute({
  method: 'post',
  path: '/scraper/seed',
  summary: 'Add seed URLs to the crawler queue',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            urls: z.array(z.string()),
          }),
        },
      },
    },
  },
  responses: {
    200: json_content(
      z.object({
        added: z.number(),
        message: z.string(),
      }),
      'URLs added to queue'
    ),
    400: json_error('Invalid payload'),
    500: json_error('Internal server error'),
  },
});

app.openapi(seed_route, async (c) => {
  try {
    const { urls } = c.req.valid('json');
    if (urls.length === 0) {
      return c.json({ added: 0, message: 'No URLs provided' }, 200);
    }

    const added = await redis.lpush('crawler:queue', ...urls);

    return c.json({ added, message: 'Successfully seeded URLs' }, 200);
  } catch (error: any) {
    console.error('Seed error:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

const status_route = createRoute({
  method: 'get',
  path: '/scraper/status',
  summary: 'Get active scraper instances and their current URLs',
  responses: {
    200: json_content(
      z.object({
        active_crawlers: z.array(
          z.object({
            id: z.string(),
            url: z.string(),
          })
        ),
        queue_length: z.number(),
      }),
      'Crawler statuses'
    ),
    500: json_error('Internal server error'),
  },
});

app.openapi(status_route, async (c) => {
  try {
    const queue_length = await redis.llen('crawler:queue');
    
    const keys = await redis.keys('crawler:status:*');
    
    const active_crawlers: { id: string, url: string }[] = [];
    
    if (keys.length > 0) {
      const values = await redis.mget(keys);
      keys.forEach((key, index) => {
        if (values[index]) {
          const id = key.replace('crawler:status:', '');
          active_crawlers.push({
            id,
            url: values[index] as string,
          });
        }
      });
    }

    return c.json({ active_crawlers, queue_length }, 200);
  } catch (error: any) {
    console.error('Status error:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

const documents_route = createRoute({
  method: 'get',
  path: '/documents',
  summary: 'Get all parsed documents',
  responses: {
    200: json_content(
      z.object({
        documents: z.array(
          z.object({
            id: z.number(),
            title: z.string(),
            url: z.string(),
            created_at: z.string(),
          })
        ),
      }),
      'List of parsed documents'
    ),
    500: json_error('Internal server error'),
  },
});

app.openapi(documents_route, async (c) => {
  try {
    const results = await db
      .select({
        id: documents_table.id,
        title: documents_table.title,
        url: documents_table.url,
        created_at: documents_table.created_at,
      })
      .from(documents_table)
      .orderBy(desc(documents_table.created_at))
      .limit(50);

    const formatted_documents = results.map(r => ({
      ...r,
      created_at: r.created_at.toISOString()
    }));

    return c.json({ documents: formatted_documents }, 200);
  } catch (error: any) {
    console.error('Documents error:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

export default app;
