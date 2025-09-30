'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Home as HomeIcon,
  Settings,
  MapPin,
  Briefcase,
  Plus,
  TrendingUp,
  User,
  Calendar,
  Inbox,
  Clock,
  Bell
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@workos-inc/authkit-nextjs/components';

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

export default function HomePage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [meetingRequestsCount, setMeetingRequestsCount] = useState(0);

  useEffect(() => {
    fetchProfiles();
    if (user) {
      checkUserProfile();
    } else {
      setCheckingProfile(false);
    }
  }, [user]);

  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/search?limit=50');
      if (response.ok) {
        const data = await response.json();
        setProfiles(data.profiles || []);
      }
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUserProfile = async () => {
    try {
      const response = await fetch('/api/profiles/my');
      if (response.ok) {
        const userProfiles = await response.json();
        const hasProf = Array.isArray(userProfiles) && userProfiles.length > 0;
        setHasProfile(hasProf);
        if (hasProf) {
          setUserProfile(userProfiles[0]);
          // Fetch meeting requests count
          fetchMeetingRequestsCount();
        }
      }
    } catch (error) {
      console.error('Failed to check user profile:', error);
    } finally {
      setCheckingProfile(false);
    }
  };

  const fetchMeetingRequestsCount = async () => {
    try {
      const response = await fetch('/api/appointments/received');
      if (response.ok) {
        const data = await response.json();
        const pending = Array.isArray(data) ? data.filter((req: any) => req.status === 'pending').length : 0;
        setMeetingRequestsCount(pending);
      }
    } catch (error) {
      console.error('Failed to fetch meeting requests:', error);
    }
  };

  const filteredProfiles = profiles.filter(profile => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      profile.name.toLowerCase().includes(query) ||
      profile.headline?.toLowerCase().includes(query) ||
      profile.bio?.toLowerCase().includes(query) ||
      profile.skills.some(skill => skill.toLowerCase().includes(query))
    );
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    return `${Math.floor(diffInDays / 30)}mo ago`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <div className="border-b border-gray-200 sticky top-0 z-50 bg-white/80 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between gap-6 h-16">
            {/* Logo */}
            <Link href="/home" className="text-xl font-bold flex-shrink-0">
              <span className="text-black">Profile</span>
              <span className="text-orange-600">Base</span>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 h-9 w-full bg-gray-50 border-gray-200 focus:bg-white"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <a
                href="https://github.com/jupudivamsikalyan/Pilot"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View on GitHub"
              >
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </Button>
              </a>
              {user && hasProfile && (
                <Link href="/meeting-requests">
                  <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                    <Bell className="h-5 w-5" />
                    {meetingRequestsCount > 0 && (
                      <span className="absolute top-1 right-1 h-2 w-2 bg-orange-500 rounded-full"></span>
                    )}
                  </Button>
                </Link>
              )}
              <Link href="/home">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <HomeIcon className="h-5 w-5" />
                </Button>
              </Link>
              {user ? (
                <Link href="/settings">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Settings className="h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button size="sm">Sign In</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar - Quick Actions */}
          <div className="lg:col-span-3 space-y-6">
            {/* Create Profile CTA */}
            {user && !checkingProfile && !hasProfile && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Get Discovered</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Create your profile and become AI-accessible to the world
                </p>
                <Link href="/profile/new">
                  <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Profile
                  </Button>
                </Link>
              </div>
            )}

            {/* Quick Actions for Profile Owners */}
            {user && hasProfile && userProfile && (
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-1">
                  <Link href={`/${userProfile.slug}`}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto py-3 px-3 hover:bg-gray-50"
                    >
                      <User className="h-4 w-4 mr-3 text-gray-600" />
                      <span className="text-sm">View My Profile</span>
                    </Button>
                  </Link>

                  <Link href="/meeting-requests">
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto py-3 px-3 hover:bg-gray-50 relative"
                    >
                      <Inbox className="h-4 w-4 mr-3 text-gray-600" />
                      <span className="text-sm">Meeting Requests</span>
                      {meetingRequestsCount > 0 && (
                        <span className="ml-auto bg-orange-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                          {meetingRequestsCount}
                        </span>
                      )}
                    </Button>
                  </Link>

                  <Link href="/calendar">
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto py-3 px-3 hover:bg-gray-50"
                    >
                      <Calendar className="h-4 w-4 mr-3 text-gray-600" />
                      <span className="text-sm">Calendar</span>
                    </Button>
                  </Link>

                  <Link href="/settings">
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto py-3 px-3 hover:bg-gray-50"
                    >
                      <Settings className="h-4 w-4 mr-3 text-gray-600" />
                      <span className="text-sm">Settings</span>
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Platform Info */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Open & Free</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                ProfileBase is open source and built for everyone. No paywalls, no premium tiers.
              </p>
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-9">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {searchQuery ? `Search results for "${searchQuery}"` : 'Discover People'}
              </h1>
              <p className="text-gray-600">
                {searchQuery
                  ? `${filteredProfiles.length} ${filteredProfiles.length === 1 ? 'person' : 'people'} found`
                  : `Browse ${profiles.length} profiles from around the world`
                }
              </p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-6 animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Profiles Grid */}
            {!loading && (
              <div className="grid grid-cols-1 gap-6">
                {filteredProfiles.map((profile) => (
                  <Link
                    key={profile.id}
                    href={`/${profile.slug}`}
                    className="group relative bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out"
                  >
                    {/* Card Content */}
                    <div className="p-6">
                      {/* Header with Avatar and Name */}
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="h-14 w-14 flex-shrink-0 ring-2 ring-gray-100 group-hover:ring-orange-100 transition-all">
                          <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-orange-400 to-orange-600 text-white">
                            {getInitials(profile.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-orange-600 transition-colors mb-1 truncate">
                            {profile.name}
                          </h3>

                          {profile.headline && (
                            <p className="text-sm text-gray-600 line-clamp-1 font-medium">
                              {profile.headline}
                            </p>
                          )}
                        </div>

                        {/* Optional badge or indicator */}
                        <div className="text-xs text-gray-400 flex-shrink-0">
                          {getTimeAgo(profile.createdAt)}
                        </div>
                      </div>

                      {/* Location */}
                      {profile.location && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{profile.location}</span>
                        </div>
                      )}

                      {/* Bio */}
                      {profile.bio && (
                        <p className="text-sm text-gray-700 line-clamp-2 mb-4 leading-relaxed">
                          {profile.bio}
                        </p>
                      )}

                      {/* Skills */}
                      {profile.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {profile.skills.slice(0, 3).map((skill, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="px-3 py-1 text-xs bg-gray-50 text-gray-700 font-medium border border-gray-200 rounded-full hover:bg-gray-100 transition-colors"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {profile.skills.length > 3 && (
                            <Badge
                              variant="secondary"
                              className="px-3 py-1 text-xs bg-orange-50 text-orange-700 font-medium border border-orange-200 rounded-full"
                            >
                              +{profile.skills.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Hover gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-orange-50/0 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </Link>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredProfiles.length === 0 && (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No profiles found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery
                    ? `No results for "${searchQuery}". Try a different search term.`
                    : 'No profiles available yet. Be the first to create one!'
                  }
                </p>
                {!user && (
                  <Link href="/login">
                    <Button>Sign In to Create Profile</Button>
                  </Link>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}