import { pgTable, uuid, text, timestamp, serial, index, customType } from 'drizzle-orm/pg-core';

export const users_table = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	username: text('username').notNull(),
	password_hash: text('password_hash').notNull(),
	role: text('role').default('user').notNull(),
	created_at: timestamp("created_at").defaultNow(),
});

export const sessions_table = pgTable('sessions', {
	id: text('id').primaryKey(),
	user_id: uuid('user_id').notNull().references(() => users_table.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
});

const tsvector = customType<{ data: string }>({
  dataType: () => 'tsvector',
});

export const documents_table = pgTable('documents', {
  id: serial('id').primaryKey(),
  url: text('url').unique().notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
	text_search_vector: tsvector('text_search_vector'),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('search_idx').using('gin', table.text_search_vector),
]);
