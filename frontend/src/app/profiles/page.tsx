'use client';

import { useState } from 'react';
import { SearchProfiles } from '@/components/search-profiles';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, 
  Quote,
  Calendar,
  Plus,
  Eye,
  Users,
  Home,
  MessageSquare,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ProfilesPage() {
  const [searchQuery, setSearchQuery] = useState('');

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
      href: '/dashboard'
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
      href: '/profile/new'
    },
    { 
      id: 'settings', 
      icon: Settings, 
      label: 'Settings',
      href: '/settings'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Top Search Bar */}
      <div className="sticky top-0 z-10 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/80 border-gray-200 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 rounded-full h-11"
            />
          </div>
        </div>
      </div>

      {/* Main Feed */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile Views Card */}
        <Card className="mb-6 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 border-purple-200/60 shadow-sm hover:shadow-md cursor-pointer rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                  <Eye className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-base">12 people viewed your profile</h3>
                  <p className="text-sm text-gray-600 mt-0.5">See who&apos;s been checking you out</p>
                </div>
              </div>
              <div className="flex -space-x-2">
                <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-medium">JD</AvatarFallback>
                </Avatar>
                <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                  <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-xs font-medium">SM</AvatarFallback>
                </Avatar>
                <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                  <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs font-medium">+10</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Profile Prompt */}
        <Card className="mb-8 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-200/60 shadow-sm rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 text-base">Join the community</h3>
                <p className="text-sm text-gray-600 mt-1">Create your profile and connect with people worldwide</p>
              </div>
              <Button asChild size="sm" className="rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-sm">
                <Link href="/profile/new">
                  <Plus className="h-4 w-4 mr-1" />
                  Create Profile
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* People Feed */}
        <div className="space-y-4">
          <SearchProfiles 
            showFilters={false}
            limit={20}
            className="space-y-4"
          />
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