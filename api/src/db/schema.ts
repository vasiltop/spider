import { pgTable, uuid, text, timestamp, serial } from 'drizzle-orm/pg-core';

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
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
