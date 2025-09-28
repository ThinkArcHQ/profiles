CREATE INDEX "idx_profiles_workos_user" ON "profiles" USING btree ("workos_user_id");--> statement-breakpoint
CREATE INDEX "idx_profiles_public_active_created" ON "profiles" USING btree ("is_public","is_active","created_at");--> statement-breakpoint
CREATE INDEX "idx_profiles_name_lower" ON "profiles" USING btree (LOWER("name"));--> statement-breakpoint
CREATE INDEX "idx_profiles_bio_search" ON "profiles" USING gin (to_tsvector('english', COALESCE("bio", '')));--> statement-breakpoint
CREATE INDEX "idx_profiles_name_public" ON "profiles" USING btree ("name","is_public","is_active");--> statement-breakpoint
CREATE INDEX "idx_profiles_created_at" ON "profiles" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_profiles_updated_at" ON "profiles" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "idx_profiles_search_filter" ON "profiles" USING btree ("is_public","is_active","name","created_at");