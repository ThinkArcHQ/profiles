import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { profiles, type NewProfile } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ProfileTransformer, CreateProfileInput, RawCreateProfileInput } from '@/lib/types/profile';
import { SlugServiceImpl } from '@/lib/services/slug-service.server';
import { createGETEndpoint, createPOSTEndpoint } from '@/lib/middleware/api-wrapper';
import { APIErrorHandler, APIErrorCodes } from '@/lib/utils/api-errors';
import { DatabasePerformanceService } from '@/lib/services/database-performance';

// GET /api/profiles - List all public profiles
const getProfilesHandler = async (request: NextRequest, context: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    // Use optimized service for better performance
    const { profiles: publicProfiles } = await DatabasePerformanceService.getPublicProfilesOptimized(limit, offset);
    
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const transformedProfiles = publicProfiles.map(profile => 
      ProfileTransformer.toPublicProfile(profile, baseUrl)
    );
    
    return NextResponse.json(transformedProfiles);
  } catch (error) {
    return APIErrorHandler.createDatabaseError('fetch profiles', error);
  }
};

export const GET = createGETEndpoint('/api/profiles', getProfilesHandler);

// POST /api/profiles - Create new profile
const createProfileHandler = async (request: NextRequest, context: any) => {
  const { user, validatedData } = context;
  
  try {
    // Use validated body data from the API wrapper instead of reading request again
    const body: RawCreateProfileInput = validatedData?.body || {};
    
    // Check if user already has a profile
    const existingProfile = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.workosUserId, user.id))
      .limit(1);
    
    if (existingProfile.length > 0) {
      return APIErrorHandler.createConflictError(
        'Profile already exists for this user',
        APIErrorCodes.PROFILE_ALREADY_EXISTS
      );
    }

    // Transform and validate input data
    const profileInput: CreateProfileInput = {
      name: body.name || body.display_name,
      email: body.email || user.email,
      bio: body.bio || body.headline,
      skills: Array.isArray(body.skills) ? body.skills : 
              typeof body.skills === 'string' ? body.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      availableFor: body.availableFor || body.available_for || ['meetings'],
      isPublic: body.isPublic ?? (body.profile_visibility !== 'private'),
      linkedinUrl: body.linkedinUrl || body.linkedin_url,
      otherLinks: body.otherLinks || body.other_links || {},
    };
    
    // Validate input data
    const validationErrors = ProfileTransformer.validateProfileData(profileInput);
    if (validationErrors.length > 0) {
      return APIErrorHandler.createValidationError(
        'Profile data validation failed',
        validationErrors.map(error => ({
          field: 'profile',
          message: error,
        }))
      );
    }

    // Generate unique slug
    const slugService = new SlugServiceImpl();
    let slug: string;
    try {
      slug = await slugService.generateSlug(profileInput.name);
    } catch (error) {
      return APIErrorHandler.createError(
        'Failed to generate profile URL',
        APIErrorCodes.INVALID_SLUG_FORMAT
      );
    }

    // Prepare profile data for database
    const newProfile: NewProfile = {
      workosUserId: user.id,
      slug,
      name: profileInput.name,
      email: profileInput.email,
      bio: profileInput.bio || null,
      skills: profileInput.skills,
      availableFor: profileInput.availableFor,
      isPublic: profileInput.isPublic,
      isActive: true,
      linkedinUrl: profileInput.linkedinUrl || null,
      otherLinks: profileInput.otherLinks,
    };

    // Insert profile into database
    let createdProfile;
    try {
      [createdProfile] = await db.insert(profiles).values(newProfile).returning();
    } catch (error: any) {
      return APIErrorHandler.createDatabaseError('create profile', error);
    }
    
    // Return public profile format
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const publicProfile = ProfileTransformer.toPublicProfile(createdProfile, baseUrl);
    
    return NextResponse.json(publicProfile, { status: 201 });
  } catch (error) {
    return APIErrorHandler.handleUnexpectedError(error, 'create profile');
  }
};

export const POST = createPOSTEndpoint(
  '/api/profiles',
  createProfileHandler,
  {
    requireAuth: true,
    validation: {
      body: {
        required: ['name'],
        fields: {
          name: { type: 'string', required: true, minLength: 2, maxLength: 255 },
          email: { type: 'email', maxLength: 255 },
          bio: { type: 'string', maxLength: 2000 },
          skills: { type: 'array', maxItems: 20 },
          availableFor: { type: 'array', maxItems: 10 },
          isPublic: { type: 'boolean' },
          linkedinUrl: { type: 'url', maxLength: 500 },
          otherLinks: { type: 'string' }, // JSON object as string
        },
      },
    },
    rateLimit: {
      requests: 5, // Max 5 profile creation attempts per hour
      windowMs: 60 * 60 * 1000,
    },
  }
);