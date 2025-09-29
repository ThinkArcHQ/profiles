'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PublicProfile } from '@/lib/types/profile';
import { PrivacyStatusIndicator, getPrivacyStatusFromProfile } from '@/components/privacy-status-indicator';

interface SlugProfileClientProps {
  params: Promise<{ slug: string }>;
}

export default function SlugProfileClient({ params }: SlugProfileClientProps) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    params.then(({ slug }) => {
      fetchProfile(slug);
    });
  }, [params]);

  const fetchProfile = async (slug: string) => {
    try {
      const response = await fetch(`/api/profiles/slug/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        
        // Track profile view
        trackProfileView(data.id, 'direct');
      } else if (response.status === 404) {
        setError('Profile not found');
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const trackProfileView = async (profileId: number, source: string) => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileId,
          eventType: 'view',
          source,
        }),
      });
    } catch (error) {
      // Silently fail - analytics shouldn't break the user experience
      console.debug('Analytics tracking failed:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
        {/* Navigation */}
        <nav className="bg-white border-b border-orange-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="text-2xl font-bold text-orange-900">
                ProfileBase
              </Link>
              <div className="flex gap-2">
                <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Profile Header Skeleton */}
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-40"></div>
                    </div>
                    <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bio Section Skeleton */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-16"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Skeleton */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-24"></div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-6 bg-gray-200 rounded-full animate-pulse w-16"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
        {/* Navigation */}
        <nav className="bg-white border-b border-orange-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="text-2xl font-bold text-orange-900">
                ProfileBase
              </Link>
              <Button variant="outline" asChild>
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-orange-900 mb-2">{error}</h3>
              <p className="text-orange-600 text-center mb-6">
                The profile you&apos;re looking for doesn&apos;t exist or may be private.
              </p>
              <Button asChild>
                <Link href="/profiles">Browse Other Profiles</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  // Generate structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": profile.name,
    "description": profile.bio || `Professional available for ${profile.availableFor.join(', ')}`,
    "url": profile.profileUrl,
    "sameAs": [
      ...(profile.linkedinUrl ? [profile.linkedinUrl] : []),
      ...Object.values(profile.otherLinks)
    ].filter(Boolean),
    "knowsAbout": profile.skills,
    "seeks": profile.availableFor.map(item => ({
      "@type": "Service",
      "name": item
    })),
    "identifier": {
      "@type": "PropertyValue",
      "name": "Profile Slug",
      "value": profile.slug
    }
  };

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
      
      {/* Main Content */}
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
        {/* Navigation */}
        <nav className="bg-white border-b border-orange-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="text-2xl font-bold text-orange-900">
                ProfileBase
              </Link>
              <Button variant="outline" asChild>
                <Link href="/profiles">Browse Profiles</Link>
              </Button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Profile Header */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                        {profile.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-2xl text-orange-900">{profile.name}</CardTitle>
                          <PrivacyStatusIndicator 
                            privacyStatus={getPrivacyStatusFromProfile({ isPublic: true, isActive: true })}
                            variant="badge"
                            showTooltip={true}
                          />
                        </div>
                        <CardDescription className="text-lg">@{profile.slug}</CardDescription>
                        <p className="text-sm text-orange-600 mt-1">
                          Member since {formatDate(profile.createdAt.toString())}
                        </p>
                      </div>
                    </div>
                    <Button asChild>
                      <Link href={`/request/${profile.id}`}>Connect</Link>
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            </div>

            {/* Bio Section */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-orange-900">About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-orange-700 leading-relaxed">
                    {profile.bio || 'This user hasn&apos;t added a bio yet.'}
                  </p>
                </CardContent>
              </Card>

              {/* Links Section */}
              {(profile.linkedinUrl || Object.keys(profile.otherLinks).length > 0) && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-xl text-orange-900">Links</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {profile.linkedinUrl && (
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                          </div>
                          <a 
                            href={profile.linkedinUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-orange-700 hover:text-orange-900 hover:underline"
                          >
                            LinkedIn Profile
                          </a>
                        </div>
                      )}
                      {Object.entries(profile.otherLinks).map(([label, url]) => (
                        <div key={label} className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </div>
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-orange-700 hover:text-orange-900 hover:underline"
                          >
                            {label}
                          </a>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Skills */}
              {profile.skills.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-orange-900">Skills & Expertise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Availability */}
              {profile.availableFor.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-orange-900">Available For</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {profile.availableFor.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-orange-700 capitalize">{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Connect Card */}
              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardHeader>
                  <CardTitle className="text-lg">Ready to Connect?</CardTitle>
                  <CardDescription className="text-orange-100">
                    Send a connection request to {profile.name.split(' ')[0]}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="secondary" className="w-full">
                    <Link href={`/request/${profile.id}`}>
                      Send Connection Request
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Share Profile Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-orange-900">Share Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                      <code className="text-sm text-gray-600 flex-1 truncate">
                        {profile.profileUrl}
                      </code>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(profile.profileUrl);
                          // You could add a toast notification here
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                    <p className="text-sm text-orange-600">
                      Share this clean URL to help others find {profile.name.split(' ')[0]}&apos;s profile.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}