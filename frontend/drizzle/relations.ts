import { relations } from "drizzle-orm/relations";
import { profiles, profileAnalytics, appointments } from "./schema";

export const profileAnalyticsRelations = relations(profileAnalytics, ({one}) => ({
	profile: one(profiles, {
		fields: [profileAnalytics.profileId],
		references: [profiles.id]
	}),
}));

export const profilesRelations = relations(profiles, ({many}) => ({
	profileAnalytics: many(profileAnalytics),
	appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({one}) => ({
	profile: one(profiles, {
		fields: [appointments.profileId],
		references: [profiles.id]
	}),
}));