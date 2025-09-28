CREATE INDEX "idx_profiles_available_for" ON "profiles" USING gin ("available_for");--> statement-breakpoint
CREATE INDEX "idx_profiles_name_search" ON "profiles" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_profiles_bio_search" ON "profiles" USING gin ("bio");--> statement-breakpoint
CREATE INDEX "idx_profiles_search_composite" ON "profiles" USING btree ("is_public","is_active","created_at");