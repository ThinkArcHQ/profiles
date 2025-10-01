import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { db } from "@/lib/db/connection";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/admin/profiles/[slug]/visibility - Debug profile visibility
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get profile data
    const profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.slug, slug))
      .limit(1);

    if (profile.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profileData = profile[0];

    // Get current user for ownership check
    let currentUserId: string | undefined;
    let isOwner = false;
    try {
      const { user } = await withAuth();
      currentUserId = user?.id;
      isOwner = currentUserId === profileData.workosUserId;
    } catch {
      // Not authenticated
    }

    return NextResponse.json({
      slug: profileData.slug,
      name: profileData.name,
      isPublic: profileData.isPublic,
      isActive: profileData.isActive,
      hasContent: {
        bio: !!profileData.bio,
        skills: (profileData.skills?.length || 0) > 0,
        availableFor: (profileData.availableFor?.length || 0) > 0,
      },
      visibility: {
        canViewAsOwner: isOwner,
        canViewAsPublic: profileData.isPublic && profileData.isActive,
        canViewAsAnonymous: profileData.isPublic && profileData.isActive,
      },
      recommendations: getVisibilityRecommendations(profileData),
      createdAt: profileData.createdAt,
      updatedAt: profileData.updatedAt,
    });
  } catch (error) {
    console.error("Error checking profile visibility:", error);
    return NextResponse.json(
      { error: "Failed to check profile visibility" },
      { status: 500 }
    );
  }
}

// POST /api/admin/profiles/[slug]/visibility - Fix profile visibility
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { action } = await request.json();

    // Get current user
    const { user } = await withAuth();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get profile
    const profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.slug, slug))
      .limit(1);

    if (profile.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profileData = profile[0];

    // Check if user is owner
    if (user.id !== profileData.workosUserId) {
      return NextResponse.json(
        { error: "Only profile owner can modify visibility" },
        { status: 403 }
      );
    }

    let updates: any = { updatedAt: new Date() };

    switch (action) {
      case "make_public":
        updates.isPublic = true;
        updates.isActive = true;
        break;
      case "make_private":
        updates.isPublic = false;
        break;
      case "activate":
        updates.isActive = true;
        break;
      case "deactivate":
        updates.isActive = false;
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Update profile
    const [updatedProfile] = await db
      .update(profiles)
      .set(updates)
      .where(eq(profiles.slug, slug))
      .returning();

    return NextResponse.json({
      message: `Profile visibility updated: ${action}`,
      profile: {
        slug: updatedProfile.slug,
        isPublic: updatedProfile.isPublic,
        isActive: updatedProfile.isActive,
      },
    });
  } catch (error) {
    console.error("Error updating profile visibility:", error);
    return NextResponse.json(
      { error: "Failed to update profile visibility" },
      { status: 500 }
    );
  }
}

function getVisibilityRecommendations(profile: any): string[] {
  const recommendations: string[] = [];

  if (!profile.isActive) {
    recommendations.push(
      "Profile is inactive - activate it to make it visible"
    );
  }

  if (!profile.isPublic) {
    recommendations.push(
      "Profile is private - make it public to allow others to view it"
    );
  }

  if (!profile.bio && (!profile.skills || profile.skills.length === 0)) {
    recommendations.push(
      "Add bio and skills to make the profile more discoverable"
    );
  }

  if (!profile.availableFor || profile.availableFor.length === 0) {
    recommendations.push(
      "Add availability options (meetings, quotes, appointments) to allow contact requests"
    );
  }

  if (profile.isPublic && profile.isActive) {
    recommendations.push(
      "Profile is properly configured and visible to everyone"
    );
  }

  return recommendations;
}
