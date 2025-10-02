'use client';

import { useEffect, useState } from 'react';
import { Users, UserPlus } from 'lucide-react';
import Link from 'next/link';

interface FollowerStatsProps {
  profileId: number;
  profileSlug: string;
  className?: string;
}

interface Stats {
  followerCount: number;
  followingCount: number;
}

export function FollowerStats({ profileId, profileSlug, className = '' }: FollowerStatsProps) {
  const [stats, setStats] = useState<Stats>({ followerCount: 0, followingCount: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/profiles/${profileId}/follow`);
        if (response.ok) {
          const data = await response.json();
          setStats({
            followerCount: data.followerCount,
            followingCount: data.followingCount,
          });
        }
      } catch (error) {
        console.error('Error fetching follower stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [profileId]);

  if (isLoading) {
    return (
      <div className={`flex gap-6 text-sm text-muted-foreground ${className}`}>
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`flex gap-6 text-sm ${className}`}>
      <Link
        href={`/${profileSlug}/followers`}
        className="flex items-center gap-2 hover:text-primary transition-colors"
      >
        <Users className="h-4 w-4" />
        <span>
          <strong className="font-semibold text-foreground">{stats.followerCount}</strong>{' '}
          <span className="text-muted-foreground">
            {stats.followerCount === 1 ? 'Follower' : 'Followers'}
          </span>
        </span>
      </Link>

      <Link
        href={`/${profileSlug}/following`}
        className="flex items-center gap-2 hover:text-primary transition-colors"
      >
        <UserPlus className="h-4 w-4" />
        <span>
          <strong className="font-semibold text-foreground">{stats.followingCount}</strong>{' '}
          <span className="text-muted-foreground">Following</span>
        </span>
      </Link>
    </div>
  );
}
