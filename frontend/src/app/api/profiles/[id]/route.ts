import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { db } from '@/lib/db/connection';
import { profiles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/profiles/[id] - Get specific profile
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const profileId = parseInt(params.id);
    if (isNaN(profileId)) {
      return NextResponse.json({ error: 'Invalid profile ID' }, { status: 400 });
    }

    const [profile] = await db
      .select()
      .from(profiles)
      .where(and(eq(profiles.id, profileId), eq(profiles.isActive, true)));

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PUT /api/profiles/[id] - Update specific profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await withAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileId = parseInt(params.id);
    if (isNaN(profileId)) {
      return NextResponse.json({ error: 'Invalid profile ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, email, bio, skills, available_for } = body;

    // Check if profile exists and belongs to user
    const [existingProfile] = await db
      .select()
      .from(profiles)
      .where(and(eq(profiles.id, profileId), eq(profiles.workosUserId, user.id)));

    if (!existingProfile) {
      return NextResponse.json({ error: 'Profile not found or unauthorized' }, { status: 404 });
    }

    // Update profile
    const [updatedProfile] = await db
      .update(profiles)
      .set({
        name: name || existingProfile.name,
        email: email || existingProfile.email,
        bio: bio !== undefined ? bio : existingProfile.bio,
        skills: skills || existingProfile.skills,
        availableFor: available_for || existingProfile.availableFor,
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
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await withAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileId = parseInt(params.id);
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