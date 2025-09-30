import { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb, unique, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Profiles table
export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  workosUserId: varchar('workos_user_id', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  bio: text('bio'),
  headline: varchar('headline', { length: 500 }), // Professional headline
  location: varchar('location', { length: 255 }), // User location
  skills: text('skills').array(), // PostgreSQL array for skills
  availableFor: text('available_for').array(), // ["appointments", "quotes", "meetings"]
  isPublic: boolean('is_public').default(true).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  linkedinUrl: varchar('linkedin_url', { length: 500 }),
  otherLinks: jsonb('other_links').default('{}'),
  experience: jsonb('experience').default('[]'), // Array of experience items
  education: jsonb('education').default('[]'), // Array of education items
  projects: jsonb('projects').default('[]'), // Array of projects
  customSections: jsonb('custom_sections').default('[]'), // Array of custom sections
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Unique constraints
  workosUserIdUnique: unique().on(table.workosUserId),
  slugUnique: unique().on(table.slug),
  
  // Primary indexes for core lookups
  slugIdx: index('idx_profiles_slug').on(table.slug),
  workosUserIdx: index('idx_profiles_workos_user').on(table.workosUserId),
  
  // Privacy and visibility indexes (most critical for performance)
  publicActiveIdx: index('idx_profiles_public_active').on(table.isPublic, table.isActive),
  publicActiveCreatedIdx: index('idx_profiles_public_active_created').on(table.isPublic, table.isActive, table.createdAt),
  
  // Search performance indexes
  skillsIdx: index('idx_profiles_skills').using('gin', table.skills),
  availableForIdx: index('idx_profiles_available_for').using('gin', table.availableFor),
  
  // Text search indexes for name and bio
  nameSearchIdx: index('idx_profiles_name_search').on(table.name),
  nameLowerIdx: index('idx_profiles_name_lower').on(sql`LOWER(${table.name})`),
  bioSearchIdx: index('idx_profiles_bio_search').using('gin', sql`to_tsvector('english', COALESCE(${table.bio}, ''))`),
  
  // Composite indexes for common query patterns
  searchCompositeIdx: index('idx_profiles_search_composite').on(table.isPublic, table.isActive, table.createdAt),
  namePublicIdx: index('idx_profiles_name_public').on(table.name, table.isPublic, table.isActive),
  
  // Performance indexes for filtering and sorting
  createdAtIdx: index('idx_profiles_created_at').on(table.createdAt),
  updatedAtIdx: index('idx_profiles_updated_at').on(table.updatedAt),
  
  // Combined search and filter index for optimal query performance
  searchFilterIdx: index('idx_profiles_search_filter').on(table.isPublic, table.isActive, table.name, table.createdAt),
}));

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
  status: varchar('status', { length: 50 }).default('pending').notNull(), // "pending", "accepted", "rejected", "counter_proposed"
  proposedTime: timestamp('proposed_time'), // For counter-proposals
  counterMessage: text('counter_message'), // Message with counter-proposal
  responseMessage: text('response_message'), // Response message from profile owner
  notificationSent: boolean('notification_sent').default(false).notNull(), // Track if notification was sent
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Indexes for performance
  profileStatusIdx: index('idx_appointments_profile_status').on(table.profileId, table.status),
  requesterIdx: index('idx_appointments_requester').on(table.requesterWorkosId),
  statusIdx: index('idx_appointments_status').on(table.status),
  createdAtIdx: index('idx_appointments_created_at').on(table.createdAt),
}));

// Profile Analytics table
export const profileAnalytics = pgTable('profile_analytics', {
  id: serial('id').primaryKey(),
  profileId: integer('profile_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  eventType: varchar('event_type', { length: 50 }).notNull(), // 'view', 'share', 'qr_scan'
  source: varchar('source', { length: 100 }), // 'direct', 'search', 'ai_agent', 'social', 'qr_code'
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }), // IPv6 compatible
  referrer: text('referrer'),
  metadata: jsonb('metadata').default('{}'), // Additional tracking data
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Indexes for performance
  profileEventIdx: index('idx_profile_analytics_profile_event').on(table.profileId, table.eventType),
  createdAtIdx: index('idx_profile_analytics_created_at').on(table.createdAt),
  sourceIdx: index('idx_profile_analytics_source').on(table.source),
}));

// Type exports for TypeScript
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
export type ProfileAnalytic = typeof profileAnalytics.$inferSelect;
export type NewProfileAnalytic = typeof profileAnalytics.$inferInsert;

// Re-export enhanced types for convenience
export type {
  PublicProfile,
  CreateProfileInput,
  RawCreateProfileInput,
  UpdateProfileInput,
  PrivacySettings,
  ProfileSearchResult,
  ProfileSearchFilters,
  MCPProfile,
  ProfileVisibilityContext,
  RequestType,
  AvailabilityOption
} from '@/lib/types/profile';