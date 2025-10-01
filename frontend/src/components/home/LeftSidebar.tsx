'use client';

import { Button } from '@/components/ui/button';
import { Plus, User, Inbox, Calendar, Settings } from 'lucide-react';
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

interface LeftSidebarProps {
  user: any;
  checkingProfile: boolean;
  hasProfile: boolean;
  userProfile: Profile | null;
  meetingRequestsCount: number;
}

export function LeftSidebar({
  user,
  checkingProfile,
  hasProfile,
  userProfile,
  meetingRequestsCount,
}: LeftSidebarProps) {
  return (
    <div className="space-y-6">
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
                <span className="text-sm">My Profile</span>
              </Button>
            </Link>

            <Link href="/requests">
              <Button
                variant="ghost"
                className="w-full justify-start h-auto py-3 px-3 hover:bg-gray-50 relative"
              >
                <Inbox className="h-4 w-4 mr-3 text-gray-600" />
                <span className="text-sm">Requests</span>
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
    </div>
  );
}
