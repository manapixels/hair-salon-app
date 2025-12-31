ALTER TABLE "stylists" ADD COLUMN "googleTokenInvalid" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "stylists" ADD COLUMN "lastCalendarReminderSent" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "roles" text[] DEFAULT '{"CUSTOMER"}' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "role";