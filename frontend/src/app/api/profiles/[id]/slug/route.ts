import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { db } from '@/lib/db/connection';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { updateSlug, isSlugAvailable } from '@/lib/services/slug-service.server';
import { validateSlug } from '@/lib/services/slug-service';

interface RouteParams {
  params: {
    id: string;
  };
}

export const PATCH = withAuth(async (req: NextRequest, { params }: RouteParams) => {
  try {
    const { user } = req;
    const profileId = parseInt(params.id);
    
    if (isNaN(profileId)) {
      return NextResponse.json(
        { error: 'Invalid profile ID' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { slug: newSlug } = body;

    if (!newSlug || typeof newSlug !== 'string') {
      return NextResponse.json(
        { error: 'Slug is required and must be a string' },
        { status: 400 }
      );
    }

    // Fetch the current profile
    const [currentProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, profileId))
      .limit(1);

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Validate ownership
    if (currentProfile.workosUserId !== user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // If slug hasn't changed, return success
    if (currentProfile.slug === newSlug) {
      return NextResponse.json({
        success: true,
        slug: newSlug,
        message: 'Slug unchanged'
      });
    }

    // Validate slug format
    if (!validateSlug(newSlug)) {
      return NextResponse.json(
        { 
          error: 'Invalid slug format',
          details: 'Slug must be 3-50 characters, lowercase letters, numbers, and hyphens only'
        },
        { status: 400 }
      );
    }

    // Check if slug is available
    const available = await isSlugAvailable(newSlug, user?.id);
    if (!available) {
      return NextResponse.json(
        { error: 'Slug is already taken' },
        { status: 409 }
      );
    }

    // Update the slug using the service
    if (!user?.id) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 401 }
      );
    }
    
    await updateSlug(user.id, newSlug);

    // Fetch the updated profile to confirm
    const [updatedProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, profileId))
      .limit(1);

    if (!updatedProfile) {
      return NextResponse.json(
        { error: 'Failed to fetch updated profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      slug: updatedProfile.slug,
      profileUrl: `/profiles/${updatedProfile.slug}`,
      oldSlug: currentProfile.slug,
      message: 'Slug updated successfully'
    });

  } catch (error) {
    console.error('Error updating slug:', error);
    
    // Handle specific slug service errors
    if (error instanceof Error) {
      if (error.message.includes('Invalid slug format')) {
        return NextResponse.json(
          { error: 'Invalid slug format' },
          { status: 400 }
        );
      }
      if (error.message.includes('already taken')) {
        return NextResponse.json(
          { error: 'Slug is already taken' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update slug' },
      { status: 500 }
    );
  }
});