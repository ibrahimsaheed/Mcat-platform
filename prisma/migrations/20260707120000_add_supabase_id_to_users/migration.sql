-- Add supabaseId column to link Supabase Auth users to Prisma users table
ALTER TABLE "users" ADD COLUMN "supabaseId" TEXT;

-- Unique constraint ensures one-to-one mapping between Supabase and Prisma users.
-- PostgreSQL allows multiple NULLs in unique constraints, so existing rows are fine.
CREATE UNIQUE INDEX "users_supabaseId_key" ON "users"("supabaseId");
