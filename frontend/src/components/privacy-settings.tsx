'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield, Eye, EyeOff, Globe, Lock, AlertCircle, Save, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';

export interface PrivacySettings {
  isPublic: boolean;
  showInSearch: boolean;
  allowMeetingRequests: boolean;
}

interface PrivacySettingsProps {
  currentSettings: PrivacySettings;
  onUpdate: (settings: PrivacySettings) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export function PrivacySettingsComponent({ 
  currentSettings, 
  onUpdate, 
  loading = false,
  className = ""
}: PrivacySettingsProps) {
  const [settings, setSettings] = useState<PrivacySettings>(currentSettings);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { addToast } = useToast();

  const handleSettingChange = (key: keyof PrivacySettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    
    // Auto-adjust dependent settings
    if (key === 'isPublic' && !value) {
      // If making profile private, disable search and meeting requests
      newSettings.showInSearch = false;
      newSettings.allowMeetingRequests = false;
    } else if (key === 'showInSearch' && value && !settings.isPublic) {
      // If enabling search, must make profile public
      newSettings.isPublic = true;
    } else if (key === 'allowMeetingRequests' && value && !settings.isPublic) {
      // If enabling meeting requests, must make profile public
      newSettings.isPublic = true;
    }
    
    setSettings(newSettings);
    setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(currentSettings));
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    
    try {
      setSaving(true);
      await onUpdate(settings);
      setHasChanges(false);
      addToast({
        type: 'success',
        title: 'Privacy settings updated',
        description: 'Your privacy preferences have been saved successfully.'
      });
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      // Reset to current settings on error
      setSettings(currentSettings);
      setHasChanges(false);
      addToast({
        type: 'error',
        title: 'Failed to update privacy settings',
        description: 'Please try again or contact support if the problem persists.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(currentSettings);
    setHasChanges(false);
  };

  const privacyOptions = [
    {
      key: 'isPublic' as keyof PrivacySettings,
      label: 'Public Profile',
      description: 'Make your profile visible to everyone, including AI agents',
      icon: settings.isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />,
      enabled: settings.isPublic,
      impact: settings.isPublic ? 'Your profile can be discovered by anyone' : 'Only you can see your profile',
      impactType: settings.isPublic ? 'positive' : 'neutral'
    },
    {
      key: 'showInSearch' as keyof PrivacySettings,
      label: 'Show in Search Results',
      description: 'Allow your profile to appear in search results and AI agent queries',
      icon: <Globe className="h-4 w-4" />,
      enabled: settings.showInSearch,
      disabled: !settings.isPublic,
      impact: settings.showInSearch ? 'Discoverable through search' : 'Hidden from search results',
      impactType: settings.showInSearch ? 'positive' : 'neutral'
    },
    {
      key: 'allowMeetingRequests' as keyof PrivacySettings,
      label: 'Allow Meeting Requests',
      description: 'Let AI agents and people request meetings with you',
      icon: <Shield className="h-4 w-4" />,
      enabled: settings.allowMeetingRequests,
      disabled: !settings.isPublic,
      impact: settings.allowMeetingRequests ? 'Can receive meeting requests' : 'Meeting requests disabled',
      impactType: settings.allowMeetingRequests ? 'positive' : 'neutral'
    }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Privacy Settings
        </CardTitle>
        <CardDescription>
          Control who can see your profile and how AI agents can interact with you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Privacy Status Overview */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {settings.isPublic ? (
              <Eye className="h-5 w-5 text-green-600 flex-shrink-0" />
            ) : (
              <Lock className="h-5 w-5 text-gray-600 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="font-medium">
                {settings.isPublic ? 'Public Profile' : 'Private Profile'}
              </p>
              <p className="text-sm text-gray-600">
                {settings.isPublic 
                  ? 'Visible to AI agents and people worldwide'
                  : 'Only visible to you'
                }
              </p>
            </div>
          </div>
          <Badge variant={settings.isPublic ? "default" : "secondary"} className="self-start sm:self-center">
            {settings.isPublic ? 'Public' : 'Private'}
          </Badge>
        </div>

        {/* Privacy Options */}
        <div className="space-y-4">
          {privacyOptions.map((option) => (
            <div 
              key={option.key}
              className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-4 border rounded-lg transition-colors ${
                option.disabled ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <div className="mt-1 flex-shrink-0">
                  {option.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                    <Label 
                      htmlFor={option.key}
                      className={`font-medium ${option.disabled ? 'text-gray-500' : 'cursor-pointer'}`}
                    >
                      {option.label}
                    </Label>
                    {option.disabled && (
                      <Badge variant="outline" className="text-xs self-start">
                        Requires Public Profile
                      </Badge>
                    )}
                  </div>
                  <p className={`text-sm mb-2 ${option.disabled ? 'text-gray-400' : 'text-gray-600'}`}>
                    {option.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      option.impactType === 'positive' ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <span className={`text-xs ${
                      option.impactType === 'positive' ? 'text-green-700' : 'text-gray-600'
                    }`}>
                      {option.impact}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end sm:justify-start">
                <Switch
                  id={option.key}
                  checked={option.enabled}
                  onCheckedChange={(checked) => handleSettingChange(option.key, checked)}
                  disabled={option.disabled || loading || saving}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Important Notice */}
        {!settings.isPublic && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800">Private Profile Notice</p>
              <p className="text-sm text-amber-700 mt-1">
                With a private profile, AI agents cannot discover or contact you. 
                To be discoverable by AI agents worldwide, enable &quot;Public Profile&quot;.
              </p>
            </div>
          </div>
        )}

        {/* AI Agent Information */}
        {settings.isPublic && (
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Globe className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-800">AI Agent Discovery</p>
              <p className="text-sm text-blue-700 mt-1">
                Your profile is discoverable by AI agents worldwide through the Model Context Protocol (MCP). 
                Your email address is never shared with AI agents.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {hasChanges && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t">
            <p className="text-sm text-gray-600">
              You have unsaved changes
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={saving}
                className="flex-1 sm:flex-none"
              >
                Reset
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="flex-1 sm:flex-none"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}