import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/services/analytics-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileId, eventType, source, metadata } = body;

    // Validate required fields
    if (!profileId || !eventType) {
      return NextResponse.json(
        { error: 'Profile ID and event type are required' },
        { status: 400 }
      );
    }

    // Validate event type
    if (!['view', 'share', 'qr_scan'].includes(eventType)) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      );
    }

    // Track the event
    await AnalyticsService.trackEvent({
      profileId: parseInt(profileId),
      eventType,
      source,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: getClientIP(request),
      referrer: request.headers.get('referer') || undefined,
      metadata,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}

function getClientIP(request: NextRequest): string | undefined {
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