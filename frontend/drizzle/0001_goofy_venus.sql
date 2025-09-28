ALTER TABLE "profiles" ADD COLUMN "slug" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "is_public" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "linkedin_url" varchar(500);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "other_links" jsonb DEFAULT '{}';--> statement-breakpoint
CREATE INDEX "idx_appointments_profile_status" ON "appointments" USING btree ("profile_id","status");--> statement-breakpoint
CREATE INDEX "idx_appointments_requester" ON "appointments" USING btree ("requester_workos_id");--> statement-breakpoint
CREATE INDEX "idx_profiles_slug" ON "profiles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_profiles_public_active" ON "profiles" USING btree ("is_public","is_active");--> statement-breakpoint
CREATE INDEX "idx_profiles_skills" ON "profiles" USING gin ("skills");--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_workos_user_id_unique" UNIQUE("workos_user_id");--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_slug_unique" UNIQUE("slug");