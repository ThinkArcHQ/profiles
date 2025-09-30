'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  ExternalLink, 
  Share2, 
  MessageCircle,
  ArrowLeft,
  Linkedin,
  Globe,
  Mail,
  Phone,
  Copy,
  Check,
  Users,
  Star,
  Briefcase,
  GraduationCap,
  Award,
  Heart,
  Eye,
  Home,
  MessageSquare,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ProfileClient() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchProfile(slug);
    }
  }, [slug]);

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

  const navigationItems = [
    { 
      id: 'home', 
      icon: Home, 
      label: 'Home',
      href: '/profiles'
    },
    { 
      id: 'requests', 
      icon: MessageSquare, 
      label: 'Requests',
      href: '/meeting-requests'
    },
    { 
      id: 'calendar', 
      icon: Calendar, 
      label: 'Calendar',
      href: '/calendar'
    },
    { 
      id: 'profile', 
      icon: Users, 
      label: 'Profile',
      href: '/settings'
    },
    { 
      id: 'settings', 
      icon: Settings, 
      label: 'Settings',
      href: '/settings'
    }
  ];

  const handleCopyProfile = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
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
      <div className="min-h-screen bg-white">
        {/* Top Navigation Bar */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center">
                <div className="text-2xl font-bold">
                  <span className="text-black">Profile</span>
                  <span className="text-orange-600">Base</span>
                </div>
              </div>
              
              {/* Navigation Links */}
              <div className="flex items-center space-x-4">
                <Link href="/home" className="text-gray-600 hover:text-orange-600 transition-colors">
                  Browse Profiles
                </Link>
                <Link href="/" className="text-gray-600 hover:text-orange-600 transition-colors">
                  Home
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="px-6 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        {/* Top Navigation Bar */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center">
                <div className="text-2xl font-bold">
                  <span className="text-black">Profile</span>
                  <span className="text-orange-600">Base</span>
                </div>
              </div>
              
              {/* Navigation Links */}
              <div className="flex items-center space-x-4">
                <Link href="/home" className="text-gray-600 hover:text-orange-600 transition-colors">
                  Browse Profiles
                </Link>
                <Link href="/" className="text-gray-600 hover:text-orange-600 transition-colors">
                  Home
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Error Content */}
        <div className="px-6 py-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button asChild>
              <Link href="/home">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Profiles
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <div className="text-2xl font-bold">
                <span className="text-black">Profile</span>
                <span className="text-orange-600">Base</span>
              </div>
            </div>
            
            {/* Navigation Links */}
            <div className="flex items-center space-x-4">
              <Link href="/home" className="text-gray-600 hover:text-orange-600 transition-colors">
                Browse Profiles
              </Link>
              <Link href="/" className="text-gray-600 hover:text-orange-600 transition-colors">
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Width */}
      <div className="px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Cover/Header Section */}
              <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-32 relative">
                <div className="absolute inset-0 bg-black/20"></div>
              </div>
              
              {/* Profile Info */}
              <div className="p-6 -mt-16 relative">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Avatar */}
                  <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                    <AvatarImage src={profile?.avatar} alt={profile?.name} />
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {profile?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Basic Info */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">{profile?.name}</h1>
                      <p className="text-lg text-gray-600">{profile?.title}</p>
                    </div>
                    
                    {/* Location & Availability */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {profile?.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {profile.location}
                        </div>
                      )}
                      {profile?.availability && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Available {profile.availability}
                        </div>
                      )}
                      {profile?.joinedDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Joined {formatDate(profile.joinedDate)}
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 pt-2">
                      <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Connect
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCopyProfile}>
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Heart className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bio Section */}
          {profile?.bio && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-3">About</h2>
                <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Links Section */}
          {(profile?.linkedinUrl || profile?.links?.length > 0) && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Links</h2>
                <div className="space-y-3">
                  {profile.linkedinUrl && (
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <Linkedin className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">LinkedIn Profile</span>
                      <ExternalLink className="h-4 w-4 ml-auto text-gray-400" />
                    </a>
                  )}
                  {profile.links?.map((link: any, index: number) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <Globe className="h-5 w-5 text-gray-600" />
                      <span className="font-medium">{link.title || link.url}</span>
                      <ExternalLink className="h-4 w-4 ml-auto text-gray-400" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Skills Section */}
          {profile?.skills?.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-200">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact Section */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Get in Touch</h2>
              <div className="space-y-3">
                <Button className="w-full bg-orange-600 hover:bg-orange-700" size="lg">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Send Message
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={handleCopyProfile}>
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Profile
                      </>
                    )}
                  </Button>
                  <Button variant="outline">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Floating Navigation Dock */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className={cn(
          "flex items-center gap-1 p-2 rounded-2xl",
          "backdrop-blur-lg border shadow-xl",
          "bg-white/90 border-gray-200"
        )}>
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                "relative group p-3 rounded-xl h-auto flex items-center justify-center w-12 h-12",
                "hover:bg-gray-100 transition-all duration-200"
              )}
            >
              <Link href={item.href}>
                <item.icon className="w-5 h-5" />
                <span className={cn(
                  "absolute -top-10 left-1/2 -translate-x-1/2",
                  "px-2 py-1 rounded-md text-xs font-medium",
                  "bg-gray-900 text-white",
                  "opacity-0 group-hover:opacity-100",
                  "transition-opacity whitespace-nowrap pointer-events-none",
                  "before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2",
                  "before:border-4 before:border-transparent before:border-t-gray-900"
                )}>
                  {item.label}
                </span>
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}