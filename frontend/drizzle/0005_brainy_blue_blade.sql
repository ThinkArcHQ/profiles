CREATE TABLE "profile_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" integer NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"source" varchar(100),
	"user_agent" text,
	"ip_address" varchar(45),
	"referrer" text,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile_analytics" ADD CONSTRAINT "profile_analytics_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_profile_analytics_profile_event" ON "profile_analytics" USING btree ("profile_id","event_type");--> statement-breakpoint
CREATE INDEX "idx_profile_analytics_created_at" ON "profile_analytics" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_profile_analytics_source" ON "profile_analytics" USING btree ("source");