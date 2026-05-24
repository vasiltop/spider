CREATE TABLE "documents" (
    "id" serial PRIMARY KEY NOT NULL,
    "url" text NOT NULL,
    "title" text NOT NULL,
    "content" text NOT NULL,
    "text_search_vector" tsvector GENERATED ALWAYS AS (
        to_tsvector('english', coalesce("title", '') || ' ' || coalesce("content", ''))
    ) STORED,
    "created_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "documents_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" uuid NOT NULL,
    "expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "username" text NOT NULL,
    "password_hash" text NOT NULL,
    "role" text DEFAULT 'user' NOT NULL,
    "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "search_idx" ON "documents" USING gin ("text_search_vector");
