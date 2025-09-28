import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { db } from '@/lib/db/connection';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { PrivacyService } from '@/lib/services/privacy-service';

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
    const { isPublic, isActive } = body;

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

    // Validate privacy settings
    const validation = PrivacyService.validatePrivacyUpdate(
      currentProfile,
      { isPublic, isActive },
      user?.id
    );

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: Partial<typeof profiles.$inferInsert> = {
      updatedAt: new Date()
    };

    if (typeof isPublic === 'boolean') {
      updateData.isPublic = isPublic;
    }

    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }

    // Update the profile
    const [updatedProfile] = await db
      .update(profiles)
      .set(updateData)
      .where(eq(profiles.id, profileId))
      .returning();

    if (!updatedProfile) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Return the updated privacy settings
    const privacySettings = {
      isPublic: updatedProfile.isPublic,
      showInSearch: updatedProfile.isPublic && updatedProfile.isActive,
      allowMeetingRequests: updatedProfile.isPublic && updatedProfile.isActive
    };

    return NextResponse.json({
      success: true,
      privacySettings,
      profile: {
        id: updatedProfile.id,
        isPublic: updatedProfile.isPublic,
        isActive: updatedProfile.isActive,
        updatedAt: updatedProfile.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating privacy settings:', error);
    return NextResponse.json(
      { error: 'Failed to update privacy settings' },
      { status: 500 }
    );
  }
});