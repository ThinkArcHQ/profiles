/**
 * Analytics Service for Profile Views and Shares
 * 
 * Tracks profile interactions while respecting privacy and providing
 * valuable insights to profile owners about their discoverability.
 */

import { db } from '@/lib/db/connection';
import { profileAnalytics, profiles } from '@/lib/db/schema';
import { eq, and, gte, desc, count, sql } from 'drizzle-orm';

export interface AnalyticsEvent {
  profileId: number;
  eventType: 'view' | 'share' | 'qr_scan';
  source?: 'direct' | 'search' | 'ai_agent' | 'social' | 'qr_code';
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  metadata?: Record<string, any>;
}

export interface ProfileAnalytics {
  totalViews: number;
  totalShares: number;
  totalQrScans: number;
  viewsLast7Days: number;
  viewsLast30Days: number;
  topSources: Array<{ source: string; count: number }>;
  dailyViews: Array<{ date: string; views: number }>;
}

export interface AnalyticsTimeframe {
  days: number;
  label: string;
}

export const ANALYTICS_TIMEFRAMES: AnalyticsTimeframe[] = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 3 months' },
];

export class AnalyticsService {
  /**
   * Track a profile interaction event
   */
  static async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Don't track if profile doesn't exist or is private
      const profile = await db
        .select({ id: profiles.id, isPublic: profiles.isPublic })
        .from(profiles)
        .where(eq(profiles.id, event.profileId))
        .limit(1);

      if (!profile.length || !profile[0].isPublic) {
        return; // Don't track private profiles
      }

      await db.insert(profileAnalytics).values({
        profileId: event.profileId,
        eventType: event.eventType,
        source: event.source || 'direct',
        userAgent: event.userAgent,
        ipAddress: event.ipAddress,
        referrer: event.referrer,
        metadata: event.metadata || {},
      });
    } catch (error) {
      // Log error but don't throw - analytics shouldn't break the app
      console.error('Failed to track analytics event:', error);
    }
  }

  /**
   * Track a profile view
   */
  static async trackProfileView(
    profileId: number,
    source?: string,
    request?: Request
  ): Promise<void> {
    const userAgent = request?.headers.get('user-agent') || undefined;
    const referrer = request?.headers.get('referer') || undefined;
    const ipAddress = this.getClientIP(request);

    await this.trackEvent({
      profileId,
      eventType: 'view',
      source: source as any,
      userAgent,
      ipAddress,
      referrer,
    });
  }

  /**
   * Track a profile share
   */
  static async trackProfileShare(
    profileId: number,
    platform: string,
    request?: Request
  ): Promise<void> {
    const userAgent = request?.headers.get('user-agent') || undefined;
    const ipAddress = this.getClientIP(request);

    await this.trackEvent({
      profileId,
      eventType: 'share',
      source: 'social',
      userAgent,
      ipAddress,
      metadata: { platform },
    });
  }

  /**
   * Track a QR code scan
   */
  static async trackQRScan(
    profileId: number,
    request?: Request
  ): Promise<void> {
    const userAgent = request?.headers.get('user-agent') || undefined;
    const ipAddress = this.getClientIP(request);

    await this.trackEvent({
      profileId,
      eventType: 'qr_scan',
      source: 'qr_code',
      userAgent,
      ipAddress,
    });
  }

  /**
   * Get analytics for a profile
   */
  static async getProfileAnalytics(profileId: number): Promise<ProfileAnalytics> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    try {
      // Get total counts by event type
      const totalCounts = await db
        .select({
          eventType: profileAnalytics.eventType,
          count: count(),
        })
        .from(profileAnalytics)
        .where(eq(profileAnalytics.profileId, profileId))
        .groupBy(profileAnalytics.eventType);

      // Get recent view counts
      const recentViews = await db
        .select({
          timeframe: sql<string>`CASE 
            WHEN created_at >= ${sevenDaysAgo} THEN '7days'
            WHEN created_at >= ${thirtyDaysAgo} THEN '30days'
            ELSE 'older'
          END`,
          count: count(),
        })
        .from(profileAnalytics)
        .where(
          and(
            eq(profileAnalytics.profileId, profileId),
            eq(profileAnalytics.eventType, 'view'),
            gte(profileAnalytics.createdAt, thirtyDaysAgo)
          )
        )
        .groupBy(sql`CASE 
          WHEN created_at >= ${sevenDaysAgo} THEN '7days'
          WHEN created_at >= ${thirtyDaysAgo} THEN '30days'
          ELSE 'older'
        END`);

      // Get top sources
      const topSources = await db
        .select({
          source: profileAnalytics.source,
          count: count(),
        })
        .from(profileAnalytics)
        .where(
          and(
            eq(profileAnalytics.profileId, profileId),
            eq(profileAnalytics.eventType, 'view'),
            gte(profileAnalytics.createdAt, thirtyDaysAgo)
          )
        )
        .groupBy(profileAnalytics.source)
        .orderBy(desc(count()))
        .limit(5);

      // Get daily views for the last 30 days
      const dailyViews = await db
        .select({
          date: sql<string>`DATE(created_at)`,
          views: count(),
        })
        .from(profileAnalytics)
        .where(
          and(
            eq(profileAnalytics.profileId, profileId),
            eq(profileAnalytics.eventType, 'view'),
            gte(profileAnalytics.createdAt, thirtyDaysAgo)
          )
        )
        .groupBy(sql`DATE(created_at)`)
        .orderBy(sql`DATE(created_at)`);

      // Process the results
      const totals = totalCounts.reduce((acc, item) => {
        acc[item.eventType] = item.count;
        return acc;
      }, {} as Record<string, number>);

      const recentViewCounts = recentViews.reduce((acc, item) => {
        acc[item.timeframe] = item.count;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalViews: totals.view || 0,
        totalShares: totals.share || 0,
        totalQrScans: totals.qr_scan || 0,
        viewsLast7Days: recentViewCounts['7days'] || 0,
        viewsLast30Days: (recentViewCounts['7days'] || 0) + (recentViewCounts['30days'] || 0),
        topSources: topSources.map(item => ({
          source: item.source || 'direct',
          count: item.count,
        })),
        dailyViews: dailyViews.map(item => ({
          date: item.date,
          views: item.views,
        })),
      };
    } catch (error) {
      console.error('Failed to get profile analytics:', error);
      // Return empty analytics on error
      return {
        totalViews: 0,
        totalShares: 0,
        totalQrScans: 0,
        viewsLast7Days: 0,
        viewsLast30Days: 0,
        topSources: [],
        dailyViews: [],
      };
    }
  }

  /**
   * Get client IP address from request
   */
  private static getClientIP(request?: Request): string | undefined {
    if (!request) return undefined;

    // Check various headers for the real IP
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
      return realIP;
    }

    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    if (cfConnectingIP) {
      return cfConnectingIP;
    }

    return undefined;
  }

  /**
   * Clean up old analytics data (for maintenance)
   */
  static async cleanupOldData(daysToKeep: number = 365): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    try {
      await db
        .delete(profileAnalytics)
        .where(sql`created_at < ${cutoffDate}`);
    } catch (error) {
      console.error('Failed to cleanup old analytics data:', error);
    }
  }

  /**
   * Get analytics summary for multiple profiles (for admin/dashboard)
   */
  static async getAnalyticsSummary(profileIds: number[]): Promise<Record<number, ProfileAnalytics>> {
    const results: Record<number, ProfileAnalytics> = {};

    // Get analytics for each profile
    for (const profileId of profileIds) {
      results[profileId] = await this.getProfileAnalytics(profileId);
    }

    return results;
  }
}