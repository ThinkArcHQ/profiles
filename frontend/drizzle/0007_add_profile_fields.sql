-- Add new profile fields for enhanced profile information
ALTER TABLE "profiles" ADD COLUMN "headline" varchar(500);
ALTER TABLE "profiles" ADD COLUMN "location" varchar(255);
ALTER TABLE "profiles" ADD COLUMN "experience" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "profiles" ADD COLUMN "education" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "profiles" ADD COLUMN "projects" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "profiles" ADD COLUMN "custom_sections" jsonb DEFAULT '[]'::jsonb;