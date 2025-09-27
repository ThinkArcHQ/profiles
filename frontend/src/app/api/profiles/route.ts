import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { db } from '@/lib/db/connection';
import { profiles, type NewProfile } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/profiles - List all profiles
export async function GET() {
  try {
    const allProfiles = await db.select().from(profiles).where(eq(profiles.isActive, true));
    return NextResponse.json(allProfiles);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
  }
}

// POST /api/profiles - Create new profile
export async function POST(request: NextRequest) {
  try {
    const { user } = await withAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, bio, skills, available_for } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const newProfile: NewProfile = {
      workosUserId: user.id,
      name,
      email,
      bio: bio || null,
      skills: skills || [],
      availableFor: available_for || [],
      isActive: true,
    };

    const [createdProfile] = await db.insert(profiles).values(newProfile).returning();
    return NextResponse.json(createdProfile, { status: 201 });
  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
  }
}