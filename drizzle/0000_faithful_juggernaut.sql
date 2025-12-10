CREATE TYPE "public"."AppointmentStatus" AS ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');--> statement-breakpoint
CREATE TYPE "public"."RetentionMessageType" AS ENUM('FEEDBACK_REQUEST', 'REBOOKING_NUDGE', 'WIN_BACK');--> statement-breakpoint
CREATE TYPE "public"."Role" AS ENUM('CUSTOMER', 'STYLIST', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."TagCategory" AS ENUM('CONCERN', 'OUTCOME', 'HAIR_TYPE');--> statement-breakpoint
CREATE TABLE "admin_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"weeklySchedule" json DEFAULT '{"monday":{"isOpen":true,"openingTime":"11:00","closingTime":"19:00"},"tuesday":{"isOpen":false,"openingTime":"11:00","closingTime":"19:00"},"wednesday":{"isOpen":true,"openingTime":"11:00","closingTime":"19:00"},"thursday":{"isOpen":true,"openingTime":"11:00","closingTime":"19:00"},"friday":{"isOpen":true,"openingTime":"11:00","closingTime":"19:00"},"saturday":{"isOpen":true,"openingTime":"11:00","closingTime":"19:00"},"sunday":{"isOpen":true,"openingTime":"11:00","closingTime":"19:00"}}'::json NOT NULL,
	"closedDates" json DEFAULT '[]'::json,
	"blockedSlots" json DEFAULT '{}'::json,
	"businessName" text DEFAULT 'Signature Trims Hair Salon' NOT NULL,
	"businessAddress" text DEFAULT '930 Yishun Avenue 1 #01-127, Singapore 760930' NOT NULL,
	"businessPhone" text DEFAULT '(555) 123-4567' NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" text PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"time" text NOT NULL,
	"categoryId" text,
	"estimatedDuration" integer,
	"services" json NOT NULL,
	"totalPrice" integer NOT NULL,
	"totalDuration" integer NOT NULL,
	"stylistId" text,
	"customerName" text NOT NULL,
	"customerEmail" text NOT NULL,
	"calendarEventId" text,
	"userId" text,
	"status" "AppointmentStatus" DEFAULT 'SCHEDULED' NOT NULL,
	"completedAt" timestamp,
	"feedbackSent" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"appointmentId" text NOT NULL,
	"userId" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feedback_appointmentId_unique" UNIQUE("appointmentId")
);
--> statement-breakpoint
CREATE TABLE "flagged_conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"platform" text NOT NULL,
	"reason" text NOT NULL,
	"lastMessage" text NOT NULL,
	"flaggedAt" timestamp DEFAULT now() NOT NULL,
	"resolvedAt" timestamp,
	"isResolved" boolean DEFAULT false NOT NULL,
	"resolvedBy" text
);
--> statement-breakpoint
CREATE TABLE "knowledge_base" (
	"id" text PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"tags" json DEFAULT '[]'::json,
	"embedding" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LoginToken" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"userId" text,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL
	CONSTRAINT "LoginToken_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "retention_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"messageType" "RetentionMessageType" NOT NULL,
	"daysSinceLastVisit" integer NOT NULL,
	"sentAt" timestamp DEFAULT now() NOT NULL,
	"deliveryStatus" text DEFAULT 'PENDING' NOT NULL,
	"deliveryError" text
);
--> statement-breakpoint
CREATE TABLE "service_addons" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"benefits" json DEFAULT '[]'::json,
	"price" text NOT NULL,
	"basePrice" integer NOT NULL,
	"duration" integer DEFAULT 0 NOT NULL,
	"isRecommended" boolean DEFAULT false NOT NULL,
	"isPopular" boolean DEFAULT false NOT NULL,
	"serviceId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"shortTitle" text,
	"description" text,
	"icon" text,
	"priceRangeMin" integer,
	"priceRangeMax" integer,
	"priceNote" text,
	"estimatedDuration" integer,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"isFeatured" boolean DEFAULT false NOT NULL,
	"imageUrl" text,
	"illustrationUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "service_tag_relations" (
	"id" text PRIMARY KEY NOT NULL,
	"serviceId" text NOT NULL,
	"tagId" text NOT NULL,
	CONSTRAINT "service_tag_relations_serviceId_tagId_unique" UNIQUE("serviceId","tagId")
);
--> statement-breakpoint
CREATE TABLE "service_tags" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"category" "TagCategory" NOT NULL,
	"description" text,
	"iconName" text,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"subtitle" text,
	"description" text,
	"price" text NOT NULL,
	"basePrice" integer NOT NULL,
	"maxPrice" integer,
	"duration" integer NOT NULL,
	"imageUrl" text,
	"popularityScore" integer DEFAULT 0 NOT NULL,
	"tags" json DEFAULT '[]'::json,
	"categoryId" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stylists" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"bio" text,
	"avatar" text,
	"specialties" json NOT NULL,
	"workingHours" json NOT NULL,
	"blockedDates" json DEFAULT '[]'::json,
	"isActive" boolean DEFAULT true NOT NULL,
	"userId" text,
	"googleAccessToken" text,
	"googleRefreshToken" text,
	"googleTokenExpiry" timestamp,
	"googleCalendarId" text,
	"googleEmail" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stylists_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text,
	"role" "Role" DEFAULT 'CUSTOMER' NOT NULL,
	"authProvider" text,
	"telegramId" integer,
	"whatsappPhone" text,
	"avatar" text,
	"lastVisitDate" timestamp,
	"totalVisits" integer DEFAULT 0 NOT NULL,
	"lastRetentionMessageSent" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_telegramId_unique" UNIQUE("telegramId"),
	CONSTRAINT "users_whatsappPhone_unique" UNIQUE("whatsappPhone")
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_categoryId_service_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."service_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_stylistId_stylists_id_fk" FOREIGN KEY ("stylistId") REFERENCES "public"."stylists"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_appointmentId_appointments_id_fk" FOREIGN KEY ("appointmentId") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "LoginToken" ADD CONSTRAINT "LoginToken_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retention_messages" ADD CONSTRAINT "retention_messages_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_addons" ADD CONSTRAINT "service_addons_serviceId_services_id_fk" FOREIGN KEY ("serviceId") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_tag_relations" ADD CONSTRAINT "service_tag_relations_serviceId_services_id_fk" FOREIGN KEY ("serviceId") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_tag_relations" ADD CONSTRAINT "service_tag_relations_tagId_service_tags_id_fk" FOREIGN KEY ("tagId") REFERENCES "public"."service_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_categoryId_service_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."service_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stylists" ADD CONSTRAINT "stylists_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "flagged_conversations_userId_isResolved_idx" ON "flagged_conversations" USING btree ("userId","isResolved");--> statement-breakpoint
CREATE INDEX "flagged_conversations_isResolved_flaggedAt_idx" ON "flagged_conversations" USING btree ("isResolved","flaggedAt");--> statement-breakpoint
CREATE INDEX "knowledge_base_question_idx" ON "knowledge_base" USING btree ("question");--> statement-breakpoint
CREATE INDEX "logintoken_userId_idx" ON "LoginToken" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "service_tag_relations_serviceId_idx" ON "service_tag_relations" USING btree ("serviceId");--> statement-breakpoint
CREATE INDEX "service_tag_relations_tagId_idx" ON "service_tag_relations" USING btree ("tagId");--> statement-breakpoint
CREATE INDEX "service_tags_category_idx" ON "service_tags" USING btree ("category");--> statement-breakpoint
CREATE INDEX "users_whatsappPhone_idx" ON "users" USING btree ("whatsappPhone");