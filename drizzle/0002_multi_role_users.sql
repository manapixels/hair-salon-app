-- Migration: Add roles array column to users table and drop the role column
-- This enables users to have multiple roles (e.g., STYLIST + ADMIN)

-- Add the roles column as a text array with CUSTOMER as default
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "roles" text[] DEFAULT ARRAY['CUSTOMER']::text[] NOT NULL;

-- Populate roles from existing role column (only if role column exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
    UPDATE "users" SET "roles" = ARRAY[role::text] WHERE roles = ARRAY['CUSTOMER']::text[];
  END IF;
END $$;

-- Drop the old role column
ALTER TABLE "users" DROP COLUMN IF EXISTS "role";
