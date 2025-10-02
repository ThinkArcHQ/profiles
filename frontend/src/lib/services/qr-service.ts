/**
 * QR Code Service
 * Generates deterministic QR codes for user profiles
 */

export interface QRCodeConfig {
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H'; // Error correction level
  bgColor?: string;
  fgColor?: string;
  includeMargin?: boolean;
}

export class QRCodeService {
  private static readonly DEFAULT_CONFIG: Required<QRCodeConfig> = {
    size: 256,
    level: 'M', // Medium error correction (15%)
    bgColor: '#FFFFFF',
    fgColor: '#000000',
    includeMargin: true,
  };

  /**
   * Generate profile URL from slug
   * This ensures consistent URL generation for deterministic QR codes
   */
  static getProfileUrl(slug: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://profilebase.ai';
    // Remove trailing slash if present, then add slug
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    return `${cleanBaseUrl}/${slug}`;
  }

  /**
   * Get QR code configuration with defaults
   */
  static getConfig(config?: QRCodeConfig): Required<QRCodeConfig> {
    return {
      ...this.DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * Generate QR code data URL for downloading
   * This is used for client-side download functionality
   */
  static async generateDataUrl(
    slug: string,
    config?: QRCodeConfig
  ): Promise<string> {
    // This will be implemented client-side using canvas
    // Server-side generation can be added later if needed
    return this.getProfileUrl(slug);
  }

  /**
   * Get suggested filename for QR code download
   */
  static getDownloadFilename(slug: string): string {
    return `profilebase-${slug}-qr.png`;
  }

  /**
   * Track QR code generation analytics
   */
  static async trackGeneration(profileId: number): Promise<void> {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileId,
          eventType: 'qr_generated',
          source: 'profile_dashboard',
        }),
      });
    } catch (error) {
      console.error('Failed to track QR generation:', error);
      // Don't throw - analytics failure shouldn't break functionality
    }
  }
}
