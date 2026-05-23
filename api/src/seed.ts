import { db } from './db/index.js';
import { documents_table } from './db/schema.js';

async function seed() {
  console.log('Seeding documents...');
  
  const docs = [
    {
      url: 'https://postgresql.org',
      title: 'PostgreSQL: The world\'s most advanced open source database',
      content: 'PostgreSQL is a powerful, open source object-relational database system with over 35 years of active development that has earned it a strong reputation for reliability, feature robustness, and performance.',
    },
    {
      url: 'https://redis.io',
      title: 'Redis - The open source, in-memory data store',
      content: 'Redis is an open source (BSD licensed), in-memory data structure store, used as a database, cache, and message broker. It supports data structures such as strings, hashes, lists, sets, sorted sets with range queries, bitmaps, hyperloglogs, geospatial indexes, and streams.',
    },
    {
      url: 'https://react.dev',
      title: 'React – A JavaScript library for building user interfaces',
      content: 'React makes it painless to create interactive UIs. Design simple views for each state in your application, and React will efficiently update and render just the right components when your data changes.',
    },
    {
      url: 'https://hono.dev',
      title: 'Hono - Ultrafast web framework for the Edges',
      content: 'Hono is a small, simple, and ultrafast web framework for the Edges. It works on any JavaScript runtime: Cloudflare Workers, Fastly Compute, Deno, Bun, Vercel, Lagon, AWS Lambda, Lambda@Edge, and Node.js.',
    }
  ];

  for (const doc of docs) {
    try {
      await db.insert(documents_table).values(doc).onConflictDoNothing({ target: documents_table.url });
      console.log(`Inserted: ${doc.title}`);
    } catch (e) {
      console.error(e);
    }
  }
  
  console.log('Seeding complete!');
  process.exit(0);
}

seed();
