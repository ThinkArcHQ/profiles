import { pgTable, serial, varchar, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

// Profiles table
export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  workosUserId: varchar('workos_user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  bio: text('bio'),
  skills: text('skills').array(), // PostgreSQL array for skills
  availableFor: text('available_for').array(), // ["appointments", "quotes", "meetings"]
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Appointment requests table
export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  profileId: integer('profile_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  requesterWorkosId: varchar('requester_workos_id', { length: 255 }), // Optional: if requester is logged in
  requesterName: varchar('requester_name', { length: 255 }).notNull(),
  requesterEmail: varchar('requester_email', { length: 255 }).notNull(),
  message: text('message').notNull(),
  preferredTime: timestamp('preferred_time'),
  requestType: varchar('request_type', { length: 50 }).notNull(), // "appointment", "quote", "meeting"
  status: varchar('status', { length: 50 }).default('pending').notNull(), // "pending", "accepted", "rejected"
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Type exports for TypeScript
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;