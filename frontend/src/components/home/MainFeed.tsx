'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, MapPin } from 'lucide-react';
import Link from 'next/link';
import { ChatInput } from './ChatInput';

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

interface MainFeedProps {
  user: any;
  loading: boolean;
  searchQuery: string;
  filteredProfiles: Profile[];
}

export function MainFeed({ user, loading, searchQuery, filteredProfiles }: MainFeedProps) {
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
    <div>
      {/* AI Chat Input */}
      <ChatInput />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {searchQuery ? `Search results for "${searchQuery}"` : 'Discover People'}
        </h1>
        <p className="text-gray-600">
          {searchQuery
            ? `${filteredProfiles.length} ${filteredProfiles.length === 1 ? 'person' : 'people'} found`
            : `Browse ${filteredProfiles.length} profiles from around the world`
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
              className="group relative bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ease-out"
            >
              {/* Card Content */}
              <div className="p-4">
                {/* Header with Avatar and Name */}
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-gray-100 group-hover:ring-orange-100 transition-all">
                    <AvatarFallback className="text-base font-semibold bg-gradient-to-br from-orange-400 to-orange-600 text-white">
                      {getInitials(profile.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base text-gray-900 group-hover:text-orange-600 transition-colors mb-0.5 truncate">
                      {profile.name}
                    </h3>

                    {profile.headline && (
                      <p className="text-xs text-gray-600 line-clamp-1 font-medium">
                        {profile.headline}
                      </p>
                    )}
                  </div>

                  {/* Optional badge or indicator */}
                  <div className="text-[10px] text-gray-400 flex-shrink-0">
                    {getTimeAgo(profile.createdAt)}
                  </div>
                </div>

                {/* Location */}
                {profile.location && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{profile.location}</span>
                  </div>
                )}

                {/* Bio */}
                {profile.bio && (
                  <p className="text-xs text-gray-700 line-clamp-2 mb-3 leading-relaxed">
                    {profile.bio}
                  </p>
                )}

                {/* Skills */}
                {profile.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.slice(0, 3).map((skill, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="px-2 py-0.5 text-[10px] bg-gray-50 text-gray-700 font-medium border border-gray-200 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        {skill}
                      </Badge>
                    ))}
                    {profile.skills.length > 3 && (
                      <Badge
                        variant="secondary"
                        className="px-2 py-0.5 text-[10px] bg-orange-50 text-orange-700 font-medium border border-orange-200 rounded-full"
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
  );
}
