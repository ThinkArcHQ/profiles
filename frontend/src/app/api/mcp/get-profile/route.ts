import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ProfileTransformer } from '@/lib/types/profile';
import { PrivacyService } from '@/lib/services/privacy-service';
import { AnalyticsService } from '@/lib/services/analytics-service';

/**
 * MCP Tool: get_profile
 *
 * Get detailed information about a person by their profile slug
 * Simple HTTP API for the standalone MCP server to call
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileSlug } = body;

    if (!profileSlug) {
      return NextResponse.json({
        found: false,
        error: 'Missing required field: profileSlug'
      }, { status: 400 });
    }

    const sanitizedSlug = String(profileSlug).toLowerCase().trim();

    // Find profile by slug
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.slug, sanitizedSlug));

    if (!profile) {
      return NextResponse.json({
        found: false,
        error: 'Profile not found'
      }, { status: 404 });
    }

    // Check if profile can be viewed (privacy check)
    if (!PrivacyService.canViewProfile(profile)) {
      return NextResponse.json({
        found: false,
        error: 'Profile is private'
      }, { status: 404 });
    }

    // Track AI agent profile view
    await AnalyticsService.trackProfileView(profile.id, 'ai_agent', request);

    // Transform to MCP profile format (excludes sensitive information)
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const mcpProfile = ProfileTransformer.toMCPProfile(profile, baseUrl);

    if (process.env.NODE_ENV === 'development') {
      console.log(`MCP Profile accessed: slug=${sanitizedSlug}`);
    }

    return NextResponse.json({
      found: true,
      profile: mcpProfile,
    }, { status: 200 });

  } catch (error) {
    console.error('MCP get-profile error:', error);
    return NextResponse.json({
      found: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// GET method for testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const profileSlug = searchParams.get('profileSlug') || searchParams.get('slug');

  if (!profileSlug) {
    return NextResponse.json({
      found: false,
      error: 'Missing profileSlug parameter'
    }, { status: 400 });
  }

  const postRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ profileSlug }),
  });

  return POST(postRequest);
}
