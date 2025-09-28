import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { db } from '@/lib/db/connection';
import { profiles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { ProfileTransformer, UpdateProfileInput } from '@/lib/types/profile';

// GET /api/profiles/[id] - Get specific profile with privacy controls
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profileId = parseInt(id);
    if (isNaN(profileId)) {
      return NextResponse.json({ error: 'Invalid profile ID' }, { status: 400 });
    }

    // Get current user for privacy checks
    let currentUserId: string | undefined;
    try {
      const { user } = await withAuth();
      currentUserId = user?.id;
    } catch {
      // Not authenticated - that's okay for public profiles
    }

    const [profile] = await db
      .select()
      .from(profiles)
      .where(and(eq(profiles.id, profileId), eq(profiles.isActive, true)));

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if viewer can see this profile
    if (!ProfileTransformer.canViewProfile(profile, currentUserId)) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Return appropriate profile format based on viewer
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    if (currentUserId === profile.workosUserId) {
      // Owner sees full profile
      return NextResponse.json(profile);
    } else {
      // Others see public profile only
      const publicProfile = ProfileTransformer.toPublicProfile(profile, baseUrl);
      return NextResponse.json(publicProfile);
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PUT /api/profiles/[id] - Update specific profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await withAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const profileId = parseInt(id);
    if (isNaN(profileId)) {
      return NextResponse.json({ error: 'Invalid profile ID' }, { status: 400 });
    }

    const body: UpdateProfileInput = await request.json();
    
    // Validate input data
    const validationErrors = ProfileTransformer.validateProfileData(body);
    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationErrors 
      }, { status: 400 });
    }

    // Check if profile exists and belongs to user
    const [existingProfile] = await db
      .select()
      .from(profiles)
      .where(and(eq(profiles.id, profileId), eq(profiles.workosUserId, user.id)));

    if (!existingProfile) {
      return NextResponse.json({ error: 'Profile not found or unauthorized' }, { status: 404 });
    }

    // Update profile with validated data
    const [updatedProfile] = await db
      .update(profiles)
      .set({
        name: body.name ?? existingProfile.name,
        bio: body.bio !== undefined ? body.bio : existingProfile.bio,
        skills: body.skills ?? existingProfile.skills,
        availableFor: body.availableFor ?? existingProfile.availableFor,
        isPublic: body.isPublic ?? existingProfile.isPublic,
        linkedinUrl: body.linkedinUrl !== undefined ? body.linkedinUrl : existingProfile.linkedinUrl,
        otherLinks: body.otherLinks ?? existingProfile.otherLinks,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, profileId))
      .returning();

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

// DELETE /api/profiles/[id] - Soft delete profile
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await withAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const profileId = parseInt(id);
    if (isNaN(profileId)) {
      return NextResponse.json({ error: 'Invalid profile ID' }, { status: 400 });
    }

    // Check if profile exists and belongs to user
    const [existingProfile] = await db
      .select()
      .from(profiles)
      .where(and(eq(profiles.id, profileId), eq(profiles.workosUserId, user.id)));

    if (!existingProfile) {
      return NextResponse.json({ error: 'Profile not found or unauthorized' }, { status: 404 });
    }

    // Soft delete by setting isActive to false
    await db
      .update(profiles)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(profiles.id, profileId));

    return NextResponse.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting profile:', error);
    return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 });
  }
}