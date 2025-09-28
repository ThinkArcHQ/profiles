'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, EyeOff, Globe, Lock, Shield } from 'lucide-react';

export interface PrivacyStatus {
  isPublic: boolean;
  isActive: boolean;
  showInSearch?: boolean;
  allowMeetingRequests?: boolean;
}

interface PrivacyStatusIndicatorProps {
  privacyStatus: PrivacyStatus;
  variant?: 'badge' | 'detailed' | 'compact';
  showTooltip?: boolean;
  className?: string;
}

export function PrivacyStatusIndicator({ 
  privacyStatus, 
  variant = 'badge',
  showTooltip = true,
  className = ""
}: PrivacyStatusIndicatorProps) {
  const { isPublic, isActive, showInSearch, allowMeetingRequests } = privacyStatus;

  // Determine the overall privacy level
  const getPrivacyLevel = () => {
    if (!isPublic) return 'private';
    if (isPublic && isActive) return 'public';
    if (isPublic && !isActive) return 'public-limited';
    return 'private';
  };

  const privacyLevel = getPrivacyLevel();

  // Configuration for different privacy levels
  const privacyConfig = {
    private: {
      label: 'Private',
      description: 'Only visible to you',
      icon: <Lock className="h-3 w-3" />,
      badgeVariant: 'secondary' as const,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-200'
    },
    'public-limited': {
      label: 'Public (Limited)',
      description: 'Visible but not accepting requests',
      icon: <EyeOff className="h-3 w-3" />,
      badgeVariant: 'outline' as const,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    public: {
      label: 'Public',
      description: 'Discoverable by AI agents worldwide',
      icon: <Globe className="h-3 w-3" />,
      badgeVariant: 'default' as const,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    }
  };

  const config = privacyConfig[privacyLevel];

  const renderBadgeVariant = () => (
    <Badge variant={config.badgeVariant} className={`${className} flex items-center gap-1`}>
      {config.icon}
      {config.label}
    </Badge>
  );

  const renderCompactVariant = () => (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`p-1 rounded-full ${config.bgColor}`}>
        {config.icon}
      </div>
      <span className={`text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    </div>
  );

  const renderDetailedVariant = () => (
    <div className={`p-3 rounded-lg border ${config.bgColor} ${config.borderColor} ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full bg-white border ${config.borderColor}`}>
          {config.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-medium ${config.color}`}>{config.label}</h4>
            <Badge variant={config.badgeVariant} className="text-xs">
              {privacyLevel === 'public' ? 'Active' : privacyLevel === 'public-limited' ? 'Limited' : 'Private'}
            </Badge>
          </div>
          <p className={`text-sm ${config.color} opacity-80 mb-2`}>
            {config.description}
          </p>
          
          {/* Detailed status indicators */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${isPublic ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className={config.color}>
                Profile visibility: {isPublic ? 'Public' : 'Private'}
              </span>
            </div>
            
            {isPublic && (
              <>
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${(showInSearch !== false) ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className={config.color}>
                    Search discovery: {(showInSearch !== false) ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${(allowMeetingRequests !== false && isActive) ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className={config.color}>
                    Meeting requests: {(allowMeetingRequests !== false && isActive) ? 'Accepting' : 'Disabled'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderIndicator = () => {
    switch (variant) {
      case 'detailed':
        return renderDetailedVariant();
      case 'compact':
        return renderCompactVariant();
      case 'badge':
      default:
        return renderBadgeVariant();
    }
  };

  if (!showTooltip) {
    return renderIndicator();
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {renderIndicator()}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">{config.label} Profile</p>
            <p className="text-sm">{config.description}</p>
            
            {isPublic && (
              <div className="space-y-1 text-xs border-t pt-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-3 w-3" />
                  <span>Visible to everyone</span>
                </div>
                {(showInSearch !== false) && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-3 w-3" />
                    <span>Discoverable in search</span>
                  </div>
                )}
                {(allowMeetingRequests !== false && isActive) && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3" />
                    <span>Accepting meeting requests</span>
                  </div>
                )}
              </div>
            )}
            
            {!isPublic && (
              <div className="text-xs border-t pt-2">
                <div className="flex items-center gap-2">
                  <Lock className="h-3 w-3" />
                  <span>Only visible to you</span>
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Utility function to determine privacy status from profile data
export function getPrivacyStatusFromProfile(profile: {
  isPublic?: boolean;
  isActive?: boolean;
}): PrivacyStatus {
  const isPublic = profile.isPublic ?? false;
  const isActive = profile.isActive ?? false;
  
  return {
    isPublic,
    isActive,
    showInSearch: isPublic && isActive,
    allowMeetingRequests: isPublic && isActive,
  };
}