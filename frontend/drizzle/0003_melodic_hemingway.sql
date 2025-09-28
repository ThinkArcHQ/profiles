ALTER TABLE "appointments" ADD COLUMN "proposed_time" timestamp;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "counter_message" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "response_message" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "notification_sent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_appointments_status" ON "appointments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_appointments_created_at" ON "appointments" USING btree ("created_at");