/**
 * Follower Service
 * Handles all follower/following relationships and queries
 */

import { db } from '@/lib/db/connection';
import { followers, profiles } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { PublicProfile, ProfileTransformer } from '@/lib/types/profile';

export interface FollowerStats {
  followerCount: number;
  followingCount: number;
  isFollowing?: boolean; // Is current user following this profile
  isFollowedBy?: boolean; // Does this profile follow current user
}

export interface FollowerProfile extends PublicProfile {
  followedAt: Date;
}

export class FollowerService {
  /**
   * Follow a profile
   */
  static async followProfile(followerId: number, followingId: number): Promise<boolean> {
    try {
      // Prevent self-following
      if (followerId === followingId) {
        throw new Error('Cannot follow yourself');
      }

      // Check if already following
      const existing = await db
        .select()
        .from(followers)
        .where(
          and(
            eq(followers.followerId, followerId),
            eq(followers.followingId, followingId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return false; // Already following
      }

      // Create follow relationship
      await db.insert(followers).values({
        followerId,
        followingId,
      });

      return true;
    } catch (error) {
      console.error('Error following profile:', error);
      throw error;
    }
  }

  /**
   * Unfollow a profile
   */
  static async unfollowProfile(followerId: number, followingId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(followers)
        .where(
          and(
            eq(followers.followerId, followerId),
            eq(followers.followingId, followingId)
          )
        )
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error('Error unfollowing profile:', error);
      throw error;
    }
  }

  /**
   * Get followers of a profile with pagination
   */
  static async getFollowers(
    profileId: number,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ followers: FollowerProfile[]; total: number }> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

      // Get followers with profile data
      const followerProfiles = await db
        .select({
          profile: profiles,
          followedAt: followers.createdAt,
        })
        .from(followers)
        .innerJoin(profiles, eq(followers.followerId, profiles.id))
        .where(
          and(
            eq(followers.followingId, profileId),
            eq(profiles.isActive, true),
            eq(profiles.isPublic, true)
          )
        )
        .orderBy(desc(followers.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(followers)
        .innerJoin(profiles, eq(followers.followerId, profiles.id))
        .where(
          and(
            eq(followers.followingId, profileId),
            eq(profiles.isActive, true),
            eq(profiles.isPublic, true)
          )
        );

      const result: FollowerProfile[] = followerProfiles.map((fp) => ({
        ...ProfileTransformer.toPublicProfile(fp.profile, baseUrl),
        followedAt: fp.followedAt,
      }));

      return {
        followers: result,
        total: Number(count),
      };
    } catch (error) {
      console.error('Error getting followers:', error);
      throw error;
    }
  }

  /**
   * Get profiles that a user is following with pagination
   */
  static async getFollowing(
    profileId: number,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ following: FollowerProfile[]; total: number }> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

      // Get following with profile data
      const followingProfiles = await db
        .select({
          profile: profiles,
          followedAt: followers.createdAt,
        })
        .from(followers)
        .innerJoin(profiles, eq(followers.followingId, profiles.id))
        .where(
          and(
            eq(followers.followerId, profileId),
            eq(profiles.isActive, true),
            eq(profiles.isPublic, true)
          )
        )
        .orderBy(desc(followers.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(followers)
        .innerJoin(profiles, eq(followers.followingId, profiles.id))
        .where(
          and(
            eq(followers.followerId, profileId),
            eq(profiles.isActive, true),
            eq(profiles.isPublic, true)
          )
        );

      const result: FollowerProfile[] = followingProfiles.map((fp) => ({
        ...ProfileTransformer.toPublicProfile(fp.profile, baseUrl),
        followedAt: fp.followedAt,
      }));

      return {
        following: result,
        total: Number(count),
      };
    } catch (error) {
      console.error('Error getting following:', error);
      throw error;
    }
  }

  /**
   * Check if a user is following another user
   */
  static async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    try {
      const result = await db
        .select()
        .from(followers)
        .where(
          and(
            eq(followers.followerId, followerId),
            eq(followers.followingId, followingId)
          )
        )
        .limit(1);

      return result.length > 0;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }

  /**
   * Get follower/following counts and relationship status
   */
  static async getFollowerStats(
    profileId: number,
    viewerId?: number
  ): Promise<FollowerStats> {
    try {
      // Get follower count
      const [{ followerCount }] = await db
        .select({ followerCount: sql<number>`count(*)` })
        .from(followers)
        .where(eq(followers.followingId, profileId));

      // Get following count
      const [{ followingCount }] = await db
        .select({ followingCount: sql<number>`count(*)` })
        .from(followers)
        .where(eq(followers.followerId, profileId));

      const stats: FollowerStats = {
        followerCount: Number(followerCount),
        followingCount: Number(followingCount),
      };

      // If viewer is provided, check follow relationship
      if (viewerId) {
        stats.isFollowing = await this.isFollowing(viewerId, profileId);
        stats.isFollowedBy = await this.isFollowing(profileId, viewerId);
      }

      return stats;
    } catch (error) {
      console.error('Error getting follower stats:', error);
      return {
        followerCount: 0,
        followingCount: 0,
      };
    }
  }

  /**
   * Get mutual followers between two profiles
   */
  static async getMutualFollowers(
    profileId1: number,
    profileId2: number
  ): Promise<PublicProfile[]> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

      // Get profiles that follow both users
      const mutualFollowers = await db
        .select({ profile: profiles })
        .from(followers)
        .as('f1')
        .innerJoin(
          followers.as('f2'),
          and(
            eq(sql`f1.follower_id`, sql`f2.follower_id`),
            eq(sql`f1.following_id`, profileId1),
            eq(sql`f2.following_id`, profileId2)
          )
        )
        .innerJoin(profiles, eq(sql`f1.follower_id`, profiles.id))
        .where(
          and(
            eq(profiles.isActive, true),
            eq(profiles.isPublic, true)
          )
        );

      return mutualFollowers.map((mf) =>
        ProfileTransformer.toPublicProfile(mf.profile, baseUrl)
      );
    } catch (error) {
      console.error('Error getting mutual followers:', error);
      return [];
    }
  }

  /**
   * Get recent followers for a profile (for notifications/feed)
   */
  static async getRecentFollowers(
    profileId: number,
    limit: number = 5
  ): Promise<FollowerProfile[]> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

      const recentFollowers = await db
        .select({
          profile: profiles,
          followedAt: followers.createdAt,
        })
        .from(followers)
        .innerJoin(profiles, eq(followers.followerId, profiles.id))
        .where(
          and(
            eq(followers.followingId, profileId),
            eq(profiles.isActive, true),
            eq(profiles.isPublic, true)
          )
        )
        .orderBy(desc(followers.createdAt))
        .limit(limit);

      return recentFollowers.map((rf) => ({
        ...ProfileTransformer.toPublicProfile(rf.profile, baseUrl),
        followedAt: rf.followedAt,
      }));
    } catch (error) {
      console.error('Error getting recent followers:', error);
      return [];
    }
  }
}
