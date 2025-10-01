'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Copy,
  Check,
  Share2,
  QrCode,
  Sparkles,
  Shield,
  Eye,
  Users,
} from 'lucide-react';
import Link from 'next/link';

interface Profile {
  id: number;
  slug: string;
  name: string;
  headline?: string;
  location?: string;
  bio?: string;
  skills: string[];
  createdAt: string;
}

interface RightSidebarProps {
  userProfile: Profile;
}

export function RightSidebar({ userProfile }: RightSidebarProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const copyProfileUrl = async () => {
    const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://profilebase.ai'}/${userProfile.slug}`;
    await navigator.clipboard.writeText(profileUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const shareToLinkedIn = () => {
    const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://profilebase.ai'}/${userProfile.slug}`;
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;
    window.open(linkedInUrl, '_blank');
  };

  const shareProfile = async () => {
    const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://profilebase.ai'}/${userProfile.slug}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${userProfile.name} - ProfileBase`,
          text: `Check out my profile on ProfileBase`,
          url: profileUrl,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      copyProfileUrl();
    }
  };

  return (
    <div className="space-y-6">
      {/* Professional Networking Card */}
      <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-6 border border-orange-100 shadow-sm">
        {/* Profile Info */}
        <div className="flex flex-col items-center mb-6">
          <Avatar className="h-24 w-24 mb-4 ring-4 ring-white shadow-lg">
            <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-orange-400 to-orange-600 text-white">
              {getInitials(userProfile.name)}
            </AvatarFallback>
          </Avatar>

          <h4 className="font-bold text-lg text-gray-900 text-center">{userProfile.name}</h4>
          {userProfile.headline && (
            <p className="text-sm text-gray-600 text-center mt-1 line-clamp-2">{userProfile.headline}</p>
          )}

          {/* Followers Count */}
          <div className="flex items-center gap-4 mt-3 text-sm">
            <div className="text-center">
              <p className="font-semibold text-gray-900">0</p>
              <p className="text-xs text-gray-500">Followers</p>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="text-center">
              <p className="font-semibold text-gray-900">0</p>
              <p className="text-xs text-gray-500">Following</p>
            </div>
          </div>
        </div>

        {/* Profile URL */}
        <div className="bg-white rounded-lg p-3 border border-gray-200 mb-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 mb-1.5">Share your profile</p>
          <p className="text-xs font-mono text-gray-700 break-all leading-relaxed">
            {typeof window !== 'undefined' ? window.location.origin : 'https://profilebase.ai'}/{userProfile.slug}
          </p>
        </div>

        {/* Action Icons */}
        <div className="grid grid-cols-4 gap-2">
          <Button
            onClick={copyProfileUrl}
            variant="outline"
            size="icon"
            className="h-12 w-full flex flex-col items-center justify-center gap-1 bg-white hover:bg-orange-50 hover:border-orange-300 transition-all"
            title="Copy URL"
          >
            {copiedUrl ? (
              <>
                <Check className="h-5 w-5 text-green-600" />
                <span className="text-[10px] text-green-600 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-5 w-5 text-gray-700" />
                <span className="text-[10px] text-gray-600 font-medium">Copy</span>
              </>
            )}
          </Button>

          <Button
            onClick={shareToLinkedIn}
            variant="outline"
            size="icon"
            className="h-12 w-full flex flex-col items-center justify-center gap-1 bg-white hover:bg-orange-50 hover:border-orange-300 transition-all"
            title="Share on LinkedIn"
          >
            <svg className="h-5 w-5 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            <span className="text-[10px] text-gray-600 font-medium">LinkedIn</span>
          </Button>

          <Button
            onClick={shareProfile}
            variant="outline"
            size="icon"
            className="h-12 w-full flex flex-col items-center justify-center gap-1 bg-white hover:bg-orange-50 hover:border-orange-300 transition-all"
            title="Share"
          >
            <Share2 className="h-5 w-5 text-gray-700" />
            <span className="text-[10px] text-gray-600 font-medium">Share</span>
          </Button>

          <Link href={`/${userProfile.slug}#qr-code`} className="w-full">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-full flex flex-col items-center justify-center gap-1 bg-white hover:bg-orange-50 hover:border-orange-300 transition-all"
              title="View QR Code"
            >
              <QrCode className="h-5 w-5 text-gray-700" />
              <span className="text-[10px] text-gray-600 font-medium">QR Code</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Our Values Card */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Our Values</h3>

        <div className="space-y-4">
          {/* AI-Accessible */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-900 mb-1">AI-Accessible</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Discoverable by AI agents worldwide 24/7
              </p>
            </div>
          </div>

          {/* Privacy-First */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <Shield className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-900 mb-1">Privacy-First</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                You control what AI agents see about you
              </p>
            </div>
          </div>

          {/* Transparent & Open */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <Eye className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-900 mb-1">Transparent & Open</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Open source and community-driven development
              </p>
            </div>
          </div>

          {/* Built for Everyone */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-900 mb-1">Built for Everyone</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Students, freelancers, hobbyists, professionals
              </p>
            </div>
          </div>
        </div>

        <a
          href="https://github.com/jupudivamsikalyan/Pilot"
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-4"
        >
          <Button variant="outline" size="sm" className="w-full">
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            View on GitHub
          </Button>
        </a>
      </div>
    </div>
  );
}
