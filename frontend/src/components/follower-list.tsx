'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface FollowerProfile {
  id: number;
  slug: string;
  name: string;
  bio?: string | null;
  headline?: string | null;
  skills: string[];
  followedAt: string;
}

interface FollowerListProps {
  profileId: number;
  type: 'followers' | 'following';
  className?: string;
}

export function FollowerList({ profileId, type, className = '' }: FollowerListProps) {
  const [profiles, setProfiles] = useState<FollowerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 20;

  useEffect(() => {
    const fetchProfiles = async () => {
      setIsLoading(true);
      try {
        const offset = page * limit;
        const endpoint = type === 'followers' ? 'followers' : 'following';
        const response = await fetch(
          `/api/profiles/${profileId}/${endpoint}?limit=${limit}&offset=${offset}`
        );

        if (response.ok) {
          const data = await response.json();
          setProfiles(data[type]);
          setHasMore(data.pagination.hasMore);
        }
      } catch (error) {
        console.error(`Error fetching ${type}:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, [profileId, type, page, limit]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading && profiles.length === 0) {
    return (
      <div className={`flex justify-center items-center py-12 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-muted-foreground">
          No {type === 'followers' ? 'followers' : 'following'} yet.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {profiles.map((profile) => (
          <Link key={profile.id} href={`/${profile.slug}`}>
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{profile.name}</h3>
                    {profile.headline && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {profile.headline}
                      </p>
                    )}
                    {profile.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {profile.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center px-2 py-1 rounded-md bg-secondary text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                        {profile.skills.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{profile.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {(page > 0 || hasMore) && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <span className="text-sm text-muted-foreground">Page {page + 1}</span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore || isLoading}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
