import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { isSlugAvailable } from '@/lib/services/slug-service.server';
import { validateSlug } from '@/lib/services/slug-service';

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const { user } = req;

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!validateSlug(slug)) {
      return NextResponse.json({
        available: false,
        error: 'Invalid slug format. Must be 3-50 characters, lowercase letters, numbers, and hyphens only.'
      });
    }

    // Check availability (exclude current user's profile)
    const available = await isSlugAvailable(slug, user?.id);

    return NextResponse.json({
      available,
      slug,
      valid: true
    });

  } catch (error) {
    console.error('Error checking slug availability:', error);
    return NextResponse.json(
      { error: 'Failed to check slug availability' },
      { status: 500 }
    );
  }
});