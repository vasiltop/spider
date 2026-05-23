import { pgTable, uuid, text, timestamp, serial, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users_table = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	username: text('username').notNull(),
	role: text('role').default('user').notNull(),
	created_at: timestamp("created_at").defaultNow(),
});

export const documents_table = pgTable('documents', {
	id: serial('id').primaryKey(),
  url: text('url').unique().notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('search_idx').using(
    'gin',
    sql`to_tsvector('english', ${table.title} || ' ' || ${table.content})`
  ),
]);
