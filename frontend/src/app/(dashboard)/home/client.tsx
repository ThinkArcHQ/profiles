"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { LeftSidebar } from "@/components/home/LeftSidebar";
import { MainFeed } from "@/components/home/MainFeed";
import { RightSidebar } from "@/components/home/RightSidebar";
import { useAuth } from "@workos-inc/authkit-nextjs/components";

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

export default function HomePageClient() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [meetingRequestsCount, setMeetingRequestsCount] = useState(0);

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    // Wait for auth to complete before checking profile
    if (authLoading) return;

    if (user) {
      checkUserProfile();
    } else {
      setCheckingProfile(false);
    }
  }, [user, authLoading]);

  const fetchProfiles = async () => {
    try {
      const response = await fetch("/api/search?limit=50");
      if (response.ok) {
        const data = await response.json();
        setProfiles(data.profiles || []);
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkUserProfile = async () => {
    try {
      const response = await fetch("/api/profiles/my");
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
      console.error("Error checking profile:", error);
    } finally {
      setCheckingProfile(false);
    }
  };

  const fetchMeetingRequestsCount = async () => {
    try {
      const response = await fetch("/api/appointments/received");
      if (response.ok) {
        const data = await response.json();
        const pending = Array.isArray(data)
          ? data.filter((req: any) => req.status === "pending").length
          : 0;
        setMeetingRequestsCount(pending);
      }
    } catch (error) {
      console.error("Error fetching meeting requests:", error);
    }
  };

  if (loading || checkingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const filteredProfiles = profiles.filter((profile) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      profile.name.toLowerCase().includes(query) ||
      profile.headline?.toLowerCase().includes(query) ||
      profile.bio?.toLowerCase().includes(query) ||
      profile.skills.some((skill) => skill.toLowerCase().includes(query))
    );
  });

  return (
    <div className="h-full overflow-hidden">
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
  );
}
