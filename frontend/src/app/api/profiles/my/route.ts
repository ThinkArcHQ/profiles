import { NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { db } from '@/lib/db/connection';
import { profiles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/profiles/my - Get current user's profiles
export async function GET() {
  try {
    const { user } = await withAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userProfiles = await db
      .select()
      .from(profiles)
      .where(and(eq(profiles.workosUserId, user.id), eq(profiles.isActive, true)));

    return NextResponse.json(userProfiles);
  } catch (error) {
    console.error('Error fetching user profiles:', error);
    return NextResponse.json({ error: 'Failed to fetch user profiles' }, { status: 500 });
  }
}