import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { db } from '@/lib/db/connection';
import { profiles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { ProfileTransformer } from '@/lib/types/profile';
import { DatabasePerformanceService } from '@/lib/services/database-performance';

// GET /api/profiles/slug/[slug] - Get profile by slug with privacy controls
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug || slug.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    }

    // Get current user for privacy checks
    let currentUserId: string | undefined;
    try {
      const { user } = await withAuth();
      currentUserId = user?.id;
    } catch {
      // Not authenticated - that's okay for public profiles
    }

    const profile = await DatabasePerformanceService.getProfileBySlugOptimized(slug);

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
    console.error('Error fetching profile by slug:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}