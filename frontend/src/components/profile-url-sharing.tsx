'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Twitter,
  Linkedin,
  Mail,
  Globe,
  TrendingUp,
  Eye,
  Users
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { QRCodeService } from '@/lib/services/qr-service';

interface ProfileAnalytics {
  totalViews: number;
  totalShares: number;
  totalQrScans: number;
  viewsLast7Days: number;
  viewsLast30Days: number;
  topSources: Array<{ source: string; count: number }>;
  dailyViews: Array<{ date: string; views: number }>;
}

interface ProfileUrlSharingProps {
  slug: string;
  isPublic: boolean;
  profileUrl?: string;
  profileId?: number;
  className?: string;
}

export function ProfileUrlSharing({ 
  slug, 
  isPublic, 
  profileUrl,
  profileId,
  className = ""
}: ProfileUrlSharingProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [analytics, setAnalytics] = useState<ProfileAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const { addToast } = useToast();

  const fullUrl = profileUrl || `${window.location.origin}/${slug}`;

  useEffect(() => {
    if (profileId && isPublic) {
      fetchAnalytics();
    } else {
      setLoadingAnalytics(false);
    }
  }, [profileId, isPublic]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics/${profileId}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast({
        type: 'success',
        title: 'URL copied!',
        description: 'Your profile URL has been copied to the clipboard.'
      });
    } catch (error) {
      console.error('Failed to copy URL:', error);
      addToast({
        type: 'error',
        title: 'Failed to copy URL',
        description: 'Please try selecting and copying the URL manually.'
      });
    }
  };

  const handleShare = async (platform: string) => {
    const encodedUrl = encodeURIComponent(fullUrl);
    const text = encodeURIComponent(`Check out my profile on ProfileBase`);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent('My Profile on ProfileBase')}&body=${text}%0A%0A${encodedUrl}`;
        break;
      default:
        return;
    }
    
    // Track the share event
    if (profileId) {
      trackShare(platform);
    }
    
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const trackShare = async (platform: string) => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileId,
          eventType: 'share',
          source: 'social',
          metadata: { platform },
        }),
      });
      
      // Refresh analytics after tracking
      setTimeout(fetchAnalytics, 1000);
    } catch (error) {
      console.debug('Analytics tracking failed:', error);
    }
  };

  const trackQRView = async () => {
    if (profileId && !showQR) {
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profileId,
            eventType: 'qr_scan',
            source: 'qr_code',
          }),
        });
        
        // Refresh analytics after tracking
        setTimeout(fetchAnalytics, 1000);
      } catch (error) {
        console.debug('Analytics tracking failed:', error);
      }
    }
  };

  const qrConfig = QRCodeService.getConfig({ size: 200 });

  if (!isPublic) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Profile Sharing
          </CardTitle>
          <CardDescription>
            Share your profile URL with others
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <Globe className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Private Profile</p>
              <p className="text-sm text-amber-700">
                Your profile is private and cannot be shared. Enable &quot;Public Profile&quot; in privacy settings to share your URL.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share Your Profile
        </CardTitle>
        <CardDescription>
          Share your profile URL with AI agents, colleagues, and connections
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* URL Display and Copy */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Your Profile URL</label>
            <Badge variant="default" className="bg-green-100 text-green-800">
              Public
            </Badge>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Input 
              value={fullUrl}
              readOnly
              className="font-mono text-sm flex-1"
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCopy}
              className="flex-shrink-0"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="ml-2 sm:hidden">Copy URL</span>
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(fullUrl, '_blank')}
              className="flex-1 sm:flex-none"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                trackQRView();
                setShowQR(!showQR);
              }}
              className="flex-1 sm:flex-none"
            >
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
            </Button>
          </div>
        </div>

        {/* QR Code */}
        {showQR && (
          <div className="flex justify-center p-4 bg-white border rounded-lg">
            <div className="text-center">
              <div className="mx-auto mb-3">
                <QRCodeSVG
                  value={fullUrl}
                  size={qrConfig.size}
                  level={qrConfig.level}
                  bgColor={qrConfig.bgColor}
                  fgColor={qrConfig.fgColor}
                  includeMargin={qrConfig.includeMargin}
                />
              </div>
              <p className="text-sm text-gray-600">
                Scan to visit your profile
              </p>
            </div>
          </div>
        )}

        {/* Social Sharing */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Share on Social Media</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleShare('twitter')}
              className="flex items-center gap-2 justify-center"
            >
              <Twitter className="h-4 w-4" />
              Twitter
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleShare('linkedin')}
              className="flex items-center gap-2 justify-center"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleShare('email')}
              className="flex items-center gap-2 justify-center"
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
          </div>
        </div>

        {/* Usage Information */}
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">AI Agent Discovery</h4>
            <p className="text-sm text-blue-700">
              AI agents worldwide can discover your profile through this URL using the Model Context Protocol (MCP). 
              They can search for you by name, skills, or expertise.
            </p>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Professional Networking</h4>
            <p className="text-sm text-green-700">
              Share this URL in your email signature, business cards, or social media profiles 
              to make it easy for people to find and connect with you.
            </p>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}