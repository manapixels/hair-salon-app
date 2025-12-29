CREATE TYPE "public"."BookingSource" AS ENUM('WEB', 'TELEGRAM', 'WHATSAPP');--> statement-breakpoint
CREATE TABLE "conversation_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"chatId" text NOT NULL,
	"platform" text DEFAULT 'telegram' NOT NULL,
	"context" json DEFAULT '{}'::json NOT NULL,
	"lastActivityAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"userId" text,
	"expiresAt" timestamp NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "login_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
DROP TABLE "LoginToken" CASCADE;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "bookingSource" "BookingSource" DEFAULT 'WEB' NOT NULL;--> statement-breakpoint
ALTER TABLE "login_tokens" ADD CONSTRAINT "login_tokens_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conversation_sessions_chatId_platform_idx" ON "conversation_sessions" USING btree ("chatId","platform");--> statement-breakpoint
CREATE INDEX "conversation_sessions_expiresAt_idx" ON "conversation_sessions" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "login_tokens_userId_idx" ON "login_tokens" USING btree ("userId");--> statement-breakpoint
ALTER TABLE "services" DROP COLUMN "subtitle";