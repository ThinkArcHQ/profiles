import { pgTable, index, unique, serial, varchar, text, boolean, timestamp, jsonb, foreignKey, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const profiles = pgTable("profiles", {
	id: serial().primaryKey().notNull(),
	workosUserId: varchar("workos_user_id", { length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	bio: text(),
	skills: text().array(),
	availableFor: text("available_for").array(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	slug: varchar({ length: 100 }).notNull(),
	isPublic: boolean("is_public").default(true).notNull(),
	linkedinUrl: varchar("linkedin_url", { length: 500 }),
	otherLinks: jsonb("other_links").default({}),
}, (table) => [
	index("idx_profiles_available_for").using("gin", table.availableFor.asc().nullsLast().op("array_ops")),
	index("idx_profiles_bio_search").using("gin", sql`to_tsvector('english'::regconfig, COALESCE(bio, ''::text))`),
	index("idx_profiles_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_profiles_name_lower").using("btree", sql`lower((name)::text)`),
	index("idx_profiles_name_public").using("btree", table.name.asc().nullsLast().op("bool_ops"), table.isPublic.asc().nullsLast().op("bool_ops"), table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_profiles_name_search").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("idx_profiles_public_active").using("btree", table.isPublic.asc().nullsLast().op("bool_ops"), table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_profiles_public_active_created").using("btree", table.isPublic.asc().nullsLast().op("bool_ops"), table.isActive.asc().nullsLast().op("bool_ops"), table.createdAt.asc().nullsLast().op("bool_ops")),
	index("idx_profiles_search_composite").using("btree", table.isPublic.asc().nullsLast().op("timestamp_ops"), table.isActive.asc().nullsLast().op("bool_ops"), table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_profiles_search_filter").using("btree", table.isPublic.asc().nullsLast().op("timestamp_ops"), table.isActive.asc().nullsLast().op("text_ops"), table.name.asc().nullsLast().op("text_ops"), table.createdAt.asc().nullsLast().op("bool_ops")),
	index("idx_profiles_skills").using("gin", table.skills.asc().nullsLast().op("array_ops")),
	index("idx_profiles_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("idx_profiles_updated_at").using("btree", table.updatedAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_profiles_workos_user").using("btree", table.workosUserId.asc().nullsLast().op("text_ops")),
	unique("profiles_workos_user_id_unique").on(table.workosUserId),
	unique("profiles_slug_unique").on(table.slug),
]);

export const profileAnalytics = pgTable("profile_analytics", {
	id: serial().primaryKey().notNull(),
	profileId: integer("profile_id").notNull(),
	eventType: varchar("event_type", { length: 50 }).notNull(),
	source: varchar({ length: 100 }),
	userAgent: text("user_agent"),
	ipAddress: varchar("ip_address", { length: 45 }),
	referrer: text(),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_profile_analytics_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_profile_analytics_profile_event").using("btree", table.profileId.asc().nullsLast().op("int4_ops"), table.eventType.asc().nullsLast().op("int4_ops")),
	index("idx_profile_analytics_source").using("btree", table.source.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "profile_analytics_profile_id_profiles_id_fk"
		}).onDelete("cascade"),
]);

export const appointments = pgTable("appointments", {
	id: serial().primaryKey().notNull(),
	profileId: integer("profile_id").notNull(),
	requesterWorkosId: varchar("requester_workos_id", { length: 255 }),
	requesterName: varchar("requester_name", { length: 255 }).notNull(),
	requesterEmail: varchar("requester_email", { length: 255 }).notNull(),
	message: text().notNull(),
	preferredTime: timestamp("preferred_time", { mode: 'string' }),
	requestType: varchar("request_type", { length: 50 }).notNull(),
	status: varchar({ length: 50 }).default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	proposedTime: timestamp("proposed_time", { mode: 'string' }),
	counterMessage: text("counter_message"),
	responseMessage: text("response_message"),
	notificationSent: boolean("notification_sent").default(false).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_appointments_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_appointments_profile_status").using("btree", table.profileId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("int4_ops")),
	index("idx_appointments_requester").using("btree", table.requesterWorkosId.asc().nullsLast().op("text_ops")),
	index("idx_appointments_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "appointments_profile_id_profiles_id_fk"
		}).onDelete("cascade"),
]);
