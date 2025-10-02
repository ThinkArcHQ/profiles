import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { db } from '@/lib/db/connection';
import { profiles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { FollowerService } from '@/lib/services/follower-service';

// POST /api/profiles/[id]/follow - Follow a profile
export async function POST(
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

    // Get current user's profile
    const [currentUserProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.workosUserId, user.id))
      .limit(1);

    if (!currentUserProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get target profile and check if it's public and active
    const [targetProfile] = await db
      .select()
      .from(profiles)
      .where(
        and(
          eq(profiles.id, profileId),
          eq(profiles.isActive, true),
          eq(profiles.isPublic, true)
        )
      )
      .limit(1);

    if (!targetProfile) {
      return NextResponse.json({ error: 'Profile not found or not available' }, { status: 404 });
    }

    // Prevent self-following
    if (currentUserProfile.id === profileId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Follow the profile
    const result = await FollowerService.followProfile(currentUserProfile.id, profileId);

    if (!result) {
      return NextResponse.json({ error: 'Already following this profile' }, { status: 400 });
    }

    // Get updated stats
    const stats = await FollowerService.getFollowerStats(profileId, currentUserProfile.id);

    return NextResponse.json({
      success: true,
      message: 'Successfully followed profile',
      stats,
    });
  } catch (error) {
    console.error('Error following profile:', error);
    return NextResponse.json({ error: 'Failed to follow profile' }, { status: 500 });
  }
}

// DELETE /api/profiles/[id]/follow - Unfollow a profile
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

    // Get current user's profile
    const [currentUserProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.workosUserId, user.id))
      .limit(1);

    if (!currentUserProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Unfollow the profile
    const result = await FollowerService.unfollowProfile(currentUserProfile.id, profileId);

    if (!result) {
      return NextResponse.json({ error: 'Not following this profile' }, { status: 400 });
    }

    // Get updated stats
    const stats = await FollowerService.getFollowerStats(profileId, currentUserProfile.id);

    return NextResponse.json({
      success: true,
      message: 'Successfully unfollowed profile',
      stats,
    });
  } catch (error) {
    console.error('Error unfollowing profile:', error);
    return NextResponse.json({ error: 'Failed to unfollow profile' }, { status: 500 });
  }
}

// GET /api/profiles/[id]/follow - Get follow status
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

    // Get current user if authenticated
    let currentUserProfile = null;
    try {
      const { user } = await withAuth();
      if (user) {
        [currentUserProfile] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.workosUserId, user.id))
          .limit(1);
      }
    } catch {
      // Not authenticated - that's okay
    }

    // Get follower stats
    const stats = await FollowerService.getFollowerStats(
      profileId,
      currentUserProfile?.id
    );

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting follow status:', error);
    return NextResponse.json({ error: 'Failed to get follow status' }, { status: 500 });
  }
}
