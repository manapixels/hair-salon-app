-- Migration: Rename HitPay columns to Stripe
-- This migration updates the deposits table to use Stripe instead of HitPay

-- Rename the payment ID column
ALTER TABLE "deposits" RENAME COLUMN "hitpayPaymentId" TO "stripePaymentIntentId";

-- Drop the payment URL column (not needed for Stripe - we use clientSecret instead)
ALTER TABLE "deposits" DROP COLUMN IF EXISTS "hitpayPaymentUrl";

-- Rename the unique constraint
ALTER INDEX IF EXISTS "deposits_hitpayPaymentId_unique" RENAME TO "deposits_stripePaymentIntentId_unique";
