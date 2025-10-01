'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Globe, Lock } from 'lucide-react';

interface ProfileVisibilityToggleProps {
  profileId: number;
  slug: string;
  isPublic: boolean;
  isActive: boolean;
  isOwner: boolean;
  onVisibilityChange?: (isPublic: boolean, isActive: boolean) => void;
}

export function ProfileVisibilityToggle({
  profileId,
  slug,
  isPublic,
  isActive,
  isOwner,
  onVisibilityChange
}: ProfileVisibilityToggleProps) {
  const [loading, setLoading] = useState(false);
  const [currentIsPublic, setCurrentIsPublic] = useState(isPublic);
  const [currentIsActive, setCurrentIsActive] = useState(isActive);

  if (!isOwner) {
    return null;
  }

  const updateVisibility = async (action: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/profiles/${slug}/visibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentIsPublic(result.profile.isPublic);
        setCurrentIsActive(result.profile.isActive);
        onVisibilityChange?.(result.profile.isPublic, result.profile.isActive);
      } else {
        console.error('Failed to update visibility');
      }
    } catch (error) {
      console.error('Error updating visibility:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVisibilityStatus = () => {
    if (!currentIsActive) {
      return { icon: EyeOff, text: 'Inactive', color: 'text-red-600', description: 'Profile is not visible to anyone' };
    }
    if (!currentIsPublic) {
      return { icon: Lock, text: 'Private', color: 'text-yellow-600', description: 'Only you can see this profile' };
    }
    return { icon: Globe, text: 'Public', color: 'text-green-600', description: 'Everyone can see this profile' };
  };

  const status = getVisibilityStatus();
  const StatusIcon = status.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StatusIcon className={`h-5 w-5 ${status.color}`} />
          Profile Visibility
        </CardTitle>
        <CardDescription>
          Control who can see your profile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="public-toggle" className="text-sm font-medium">
              Public Profile
            </Label>
            <p className="text-sm text-gray-500">
              Allow others to discover and view your profile
            </p>
          </div>
          <Switch
            id="public-toggle"
            checked={currentIsPublic}
            disabled={loading || !currentIsActive}
            onCheckedChange={(checked) => {
              updateVisibility(checked ? 'make_public' : 'make_private');
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="active-toggle" className="text-sm font-medium">
              Active Profile
            </Label>
            <p className="text-sm text-gray-500">
              Enable or disable your entire profile
            </p>
          </div>
          <Switch
            id="active-toggle"
            checked={currentIsActive}
            disabled={loading}
            onCheckedChange={(checked) => {
              updateVisibility(checked ? 'activate' : 'deactivate');
            }}
          />
        </div>

        <div className={`p-3 rounded-lg border ${
          status.color === 'text-green-600' ? 'bg-green-50 border-green-200' :
          status.color === 'text-yellow-600' ? 'bg-yellow-50 border-yellow-200' :
          'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <StatusIcon className={`h-4 w-4 ${status.color}`} />
            <span className={`text-sm font-medium ${status.color}`}>
              {status.text}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {status.description}
          </p>
        </div>

        {!currentIsPublic && currentIsActive && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Your profile is private. Others can't see your information or send you meeting requests.
            </p>
            <Button
              onClick={() => updateVisibility('make_public')}
              disabled={loading}
              className="w-full"
            >
              <Globe className="h-4 w-4 mr-2" />
              Make Profile Public
            </Button>
          </div>
        )}

        {!currentIsActive && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Your profile is inactive and not visible to anyone.
            </p>
            <Button
              onClick={() => updateVisibility('activate')}
              disabled={loading}
              className="w-full"
            >
              <Eye className="h-4 w-4 mr-2" />
              Activate Profile
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}