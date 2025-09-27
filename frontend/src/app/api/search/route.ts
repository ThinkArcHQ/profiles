import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { profiles } from '@/lib/db/schema';
import { eq, and, ilike, or, arrayContains } from 'drizzle-orm';

// GET /api/search - Search profiles with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const skills = searchParams.get('skills') || '';
    const availableFor = searchParams.get('available_for') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build the where conditions
    let whereConditions = [eq(profiles.isActive, true)];

    // Text search in name, email, or bio
    if (query.trim()) {
      whereConditions.push(
        or(
          ilike(profiles.name, `%${query}%`),
          ilike(profiles.email, `%${query}%`),
          ilike(profiles.bio, `%${query}%`)
        )!
      );
    }

    // Filter by skills
    if (skills.trim()) {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
      if (skillsArray.length > 0) {
        // Check if any of the searched skills exist in the profile's skills array
        const skillConditions = skillsArray.map(skill => 
          arrayContains(profiles.skills, [skill])
        );
        whereConditions.push(or(...skillConditions)!);
      }
    }

    // Filter by availability
    if (availableFor.trim()) {
      const availabilityArray = availableFor.split(',').map(a => a.trim()).filter(Boolean);
      if (availabilityArray.length > 0) {
        const availabilityConditions = availabilityArray.map(availability => 
          arrayContains(profiles.availableFor, [availability])
        );
        whereConditions.push(or(...availabilityConditions)!);
      }
    }

    // Execute the search query
    const searchResults = await db
      .select({
        id: profiles.id,
        name: profiles.name,
        email: profiles.email,
        bio: profiles.bio,
        skills: profiles.skills,
        availableFor: profiles.availableFor,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .where(and(...whereConditions))
      .limit(limit)
      .offset(offset)
      .orderBy(profiles.createdAt);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: profiles.id })
      .from(profiles)
      .where(and(...whereConditions));

    return NextResponse.json({
      profiles: searchResults,
      pagination: {
        total: totalCount.length,
        limit,
        offset,
        hasMore: totalCount.length > offset + limit
      }
    });
  } catch (error) {
    console.error('Error searching profiles:', error);
    return NextResponse.json({ error: 'Failed to search profiles' }, { status: 500 });
  }
}