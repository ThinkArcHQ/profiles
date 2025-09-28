import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { AnalyticsService } from '@/lib/services/analytics-service';
import { db } from '@/lib/db/connection';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET = withAuth(async (request: NextRequest, { params }: { params: { profileId: string } }) => {
  try {
    const { user } = request;
    const profileId = parseInt(params.profileId);

    if (isNaN(profileId)) {
      return NextResponse.json(
        { error: 'Invalid profile ID' },
        { status: 400 }
      );
    }

    // Check if the user owns this profile
    const profile = await db
      .select({ workosUserId: profiles.workosUserId })
      .from(profiles)
      .where(eq(profiles.id, profileId))
      .limit(1);

    if (!profile.length) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (profile[0].workosUserId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - you can only view analytics for your own profile' },
        { status: 403 }
      );
    }

    // Get analytics data
    const analytics = await AnalyticsService.getProfileAnalytics(profileId);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
});