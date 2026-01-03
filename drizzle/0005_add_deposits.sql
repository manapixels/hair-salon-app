-- Type DepositStatus skipped (already exists)
--> statement-breakpoint
CREATE TABLE "deposits" (
	"id" text PRIMARY KEY NOT NULL,
	"appointmentId" text NOT NULL,
	"userId" text,
	"customerEmail" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'SGD' NOT NULL,
	"hitpayPaymentId" text,
	"hitpayPaymentUrl" text,
	"status" "DepositStatus" DEFAULT 'PENDING' NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"paidAt" timestamp,
	"refundedAt" timestamp,
	CONSTRAINT "deposits_hitpayPaymentId_unique" UNIQUE("hitpayPaymentId")
);
--> statement-breakpoint
ALTER TABLE "admin_settings" ADD COLUMN "depositEnabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_settings" ADD COLUMN "depositPercentage" integer DEFAULT 15 NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_settings" ADD COLUMN "depositTrustThreshold" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_settings" ADD COLUMN "depositRefundWindowHours" integer DEFAULT 24 NOT NULL;--> statement-breakpoint
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_appointmentId_appointments_id_fk" FOREIGN KEY ("appointmentId") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deposits_appointmentId_idx" ON "deposits" USING btree ("appointmentId");--> statement-breakpoint
CREATE INDEX "deposits_status_idx" ON "deposits" USING btree ("status");