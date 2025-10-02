import { NextRequest, NextResponse } from 'next/server';
import { FollowerService } from '@/lib/services/follower-service';

// GET /api/profiles/[id]/following - Get following list
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

    // Get pagination params from query string
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate pagination params
    if (limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Limit must be between 1 and 100' }, { status: 400 });
    }
    if (offset < 0) {
      return NextResponse.json({ error: 'Offset must be non-negative' }, { status: 400 });
    }

    const result = await FollowerService.getFollowing(profileId, limit, offset);

    return NextResponse.json({
      following: result.following,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: result.total > offset + limit,
      },
    });
  } catch (error) {
    console.error('Error getting following:', error);
    return NextResponse.json({ error: 'Failed to get following' }, { status: 500 });
  }
}
