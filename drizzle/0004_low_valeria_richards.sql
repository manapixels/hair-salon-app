ALTER TABLE "services" ADD COLUMN "processingWaitTime" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "processingDuration" integer DEFAULT 0 NOT NULL;