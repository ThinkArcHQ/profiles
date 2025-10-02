'use client';

import { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, Download, Share2, Copy, Check } from 'lucide-react';
import { QRCodeService } from '@/lib/services/qr-service';

interface QRCodeDialogProps {
  profileSlug: string;
  profileName: string;
  profileId: number;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
  trigger?: React.ReactNode; // Custom trigger element
}

export function QRCodeDialog({
  profileSlug,
  profileName,
  profileId,
  variant = 'ghost',
  size = 'default',
  className = '',
  showLabel = true,
  trigger,
}: QRCodeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const profileUrl = QRCodeService.getProfileUrl(profileSlug);
  const qrConfig = QRCodeService.getConfig();

  // Track QR code generation when dialog opens
  useEffect(() => {
    if (isOpen) {
      QRCodeService.trackGeneration(profileId);
    }
  }, [isOpen, profileId]);

  const handleDownload = async () => {
    if (!qrRef.current) return;

    try {
      // Get the SVG element
      const svgElement = qrRef.current.querySelector('svg');
      if (!svgElement) return;

      // Create a canvas and draw the SVG on it
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const img = new Image();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        // Set canvas size to match QR code size with padding
        const padding = 40;
        canvas.width = qrConfig.size + padding * 2;
        canvas.height = qrConfig.size + padding * 2;

        // Fill white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw QR code
        ctx.drawImage(img, padding, padding, qrConfig.size, qrConfig.size);

        // Convert canvas to blob and download
        canvas.toBlob((blob) => {
          if (!blob) return;
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = QRCodeService.getDownloadFilename(profileSlug);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(downloadUrl);
          URL.revokeObjectURL(url);
        });
      };

      img.src = url;
    } catch (error) {
      console.error('Failed to download QR code:', error);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profileName} - ProfileBase`,
          text: `Check out ${profileName}'s profile on ProfileBase`,
          url: profileUrl,
        });
      } catch (error) {
        // User cancelled or share failed
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback to copy URL
      handleCopyUrl();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button variant={variant} size={size} className={className}>
            <QrCode className={size === 'icon' ? 'h-5 w-5' : 'h-4 w-4 mr-2'} />
            {showLabel && size !== 'icon' && 'QR Code'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profile QR Code</DialogTitle>
          <DialogDescription>
            Share your profile with anyone by showing them this QR code
          </DialogDescription>
        </DialogHeader>

        {/* QR Code Display */}
        <div className="flex flex-col items-center gap-6 py-6">
          <div
            ref={qrRef}
            className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm"
          >
            <QRCodeSVG
              value={profileUrl}
              size={qrConfig.size}
              level={qrConfig.level}
              bgColor={qrConfig.bgColor}
              fgColor={qrConfig.fgColor}
              includeMargin={qrConfig.includeMargin}
            />
          </div>

          {/* Profile Info */}
          <div className="text-center">
            <p className="font-semibold text-gray-900">{profileName}</p>
            <p className="text-sm text-gray-500 mt-1 break-all max-w-sm">
              {profileUrl}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={handleDownload}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              className="w-full"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={handleCopyUrl}
            className="w-full"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </>
            )}
          </Button>
        </div>

        {/* Info Note */}
        <p className="text-xs text-gray-500 text-center mt-2">
          This QR code is unique to your profile and will always link to the same URL
        </p>
      </DialogContent>
    </Dialog>
  );
}
