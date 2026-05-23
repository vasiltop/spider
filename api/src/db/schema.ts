import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const users_table = pgTable('users', {
	id: uuid("id").defaultRandom().primaryKey(),
	username: text("username").notNull(),
	created_at: timestamp("created_at").defaultNow(),
});
