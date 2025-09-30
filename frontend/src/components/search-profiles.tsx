'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { ProfileSearchResult } from '@/lib/types/profile';
import { PrivacyStatusIndicator, getPrivacyStatusFromProfile } from '@/components/privacy-status-indicator';

interface SearchProfilesProps {
  showFilters?: boolean;
  limit?: number;
  className?: string;
}

export function SearchProfiles({ showFilters = true, limit = 12, className = '' }: SearchProfilesProps) {
  const [searchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [results, setResults] = useState<ProfileSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchProfiles = useCallback(async (query: string, availability: string, offset = 0) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: query,
        skills: '',
        available_for: availability === 'all' ? '' : availability,
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(`/api/search?${params}`);
      if (!response.ok) {
        throw new Error('Failed to search profiles');
      }

      const data: ProfileSearchResult = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Initial load
  useEffect(() => {
    searchProfiles('', 'all');
  }, [searchProfiles]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchProfiles(searchQuery, availabilityFilter);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, availabilityFilter, searchProfiles]);

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvailabilityColor = (type: string) => {
    switch (type) {
      case 'meetings': return 'bg-blue-100 text-blue-800';
      case 'quotes': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const trackProfileClick = async (profileId: number, source: string) => {
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

  return (
    <div className={`space-y-4 ${className}`}>
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by availability" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">All availability</SelectItem>
                  <SelectItem value="meetings">Meetings</SelectItem>
                  <SelectItem value="quotes">Quotes</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Results */}
      <div>
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-white border border-gray-200/60 rounded-xl shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start space-x-4">
                    <Skeleton className="h-14 w-14 rounded-full" />
                    <div className="flex-1 space-y-3">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-16 w-full" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <Card className="bg-white border border-gray-200/60 rounded-xl shadow-sm">
            <CardContent className="p-8 text-center">
              <p className="text-red-600 mb-4 font-medium">{error}</p>
              <Button 
                variant="outline" 
                onClick={() => searchProfiles(searchQuery, availabilityFilter)}
                className="rounded-full"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {results && !loading && (
          <>
            {results.profiles.length === 0 ? (
              <Card className="bg-white border border-gray-200/60 rounded-xl shadow-sm">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No people found</h3>
                  <p className="text-gray-600">Try adjusting your search</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {results.profiles.map((profile) => (
                  <Card key={profile.id} className="bg-white hover:shadow-md cursor-pointer border border-gray-200/60 rounded-xl shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-14 w-14 shrink-0 shadow-sm">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-base">
                            {getUserInitials(profile.name)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900 truncate text-base">{profile.name}</h3>
                                <PrivacyStatusIndicator 
                                  privacyStatus={getPrivacyStatusFromProfile({ isPublic: true, isActive: true })}
                                  variant="badge"
                                  showTooltip={true}
                                />
                              </div>
                              <p className="text-sm text-gray-500 mt-0.5">
                                Just joined the community
                              </p>
                            </div>
                            <span className="text-xs text-gray-400 shrink-0 ml-3 font-medium">
                              {getTimeAgo(profile.createdAt instanceof Date ? profile.createdAt.toISOString() : profile.createdAt)}
                            </span>
                          </div>
                          
                          {profile.bio && (
                            <p className="text-sm text-gray-700 mb-4 line-clamp-2 leading-relaxed">{profile.bio}</p>
                          )}

                          {profile.availableFor.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {profile.availableFor.map((availability) => (
                                <Badge 
                                  key={availability} 
                                  className={`text-xs font-medium rounded-full px-2.5 py-1 ${getAvailabilityColor(availability)}`}
                                  variant="secondary"
                                >
                                  {availability}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex gap-2">
                              <Button asChild size="sm" variant="outline" className="rounded-full border-gray-300 hover:bg-gray-50 font-medium">
                                <Link 
                                  href={`/${profile.slug}`}
                                  onClick={() => trackProfileClick(profile.id, 'search')}
                                >
                                  View Profile
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}