'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FollowButtonProps {
  profileId: number;
  initialIsFollowing?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  profileId,
  initialIsFollowing = false,
  variant = 'default',
  size = 'default',
  showIcon = true,
  onFollowChange,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFollow = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/profiles/${profileId}/follow`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to follow profile');
      }

      setIsFollowing(true);
      onFollowChange?.(true);

      toast({
        title: 'Success',
        description: 'Successfully followed profile',
      });
    } catch (error) {
      console.error('Error following profile:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to follow profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/profiles/${profileId}/follow`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to unfollow profile');
      }

      setIsFollowing(false);
      onFollowChange?.(false);

      toast({
        title: 'Success',
        description: 'Successfully unfollowed profile',
      });
    } catch (error) {
      console.error('Error unfollowing profile:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to unfollow profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    if (isFollowing) {
      handleUnfollow();
    } else {
      handleFollow();
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant={isFollowing ? 'outline' : variant}
      size={size}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {showIcon && (
            isFollowing ? (
              <UserMinus className="h-4 w-4 mr-2" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )
          )}
          {isFollowing ? 'Unfollow' : 'Follow'}
        </>
      )}
    </Button>
  );
}
