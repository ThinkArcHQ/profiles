'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppSidebar } from '@/components/app-sidebar';
import { LeftSidebar } from '@/components/home/LeftSidebar';
import { MainFeed } from '@/components/home/MainFeed';
import { RightSidebar } from '@/components/home/RightSidebar';
import { Search, Settings, Bell } from 'lucide-react';
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


  return (
    <>
      {user && hasProfile && <AppSidebar />}
      <div className="h-screen bg-[#f5f5f0] flex flex-col overflow-hidden" style={{ marginLeft: user && hasProfile ? '64px' : '0' }}>
        {/* Top Navigation */}
        <div className="border-b border-gray-200 bg-white/80 backdrop-blur-md flex-shrink-0 h-16">
          <div className="max-w-full px-6 h-full">
            <div className="flex items-center justify-between gap-6 h-full">
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
                  <Link href="/requests">
                    <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                      <Bell className="h-5 w-5" />
                      {meetingRequestsCount > 0 && (
                        <span className="absolute top-1 right-1 h-2 w-2 bg-orange-500 rounded-full"></span>
                      )}
                    </Button>
                  </Link>
                )}
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
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full px-6 py-6">
            {/* Left Sidebar - Fixed */}
            <div className="lg:col-span-2 h-full overflow-y-auto scrollbar-hide">
              <LeftSidebar
                user={user}
                checkingProfile={checkingProfile}
                hasProfile={hasProfile}
                userProfile={userProfile}
                meetingRequestsCount={meetingRequestsCount}
              />
            </div>

            {/* Main Feed - Scrollable */}
            <div className="lg:col-span-7 h-full overflow-y-auto scrollbar-hide">
              <MainFeed
                user={user}
                loading={loading}
                searchQuery={searchQuery}
                filteredProfiles={filteredProfiles}
              />
            </div>

            {/* Right Sidebar - Fixed */}
            {user && hasProfile && userProfile && (
              <div className="lg:col-span-3 h-full overflow-y-auto scrollbar-hide">
                <RightSidebar userProfile={userProfile} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
