'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Bell,
  Shield,
  Settings as SettingsIcon,
  Save,
  Trash2,
  AlertTriangle,
  Mail,
  Globe,
  Link,
  Lock
} from 'lucide-react';
import { PrivacySettingsComponent } from '@/components/privacy-settings';
import { SlugEditor } from '@/components/slug-editor';
import { ProfileUrlSharing } from '@/components/profile-url-sharing';
import { PrivacyStatusIndicator, getPrivacyStatusFromProfile } from '@/components/privacy-status-indicator';

interface Profile {
  id: string;
  slug: string;
  name: string;
  email: string;
  bio: string | null;
  skills: string[];
  availableFor: string[];
  isActive: boolean;
  isPublic: boolean;
  linkedinUrl?: string | null;
  otherLinks?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    skills: [] as string[],
    availableFor: [] as string[],
    linkedinUrl: '',
    otherLinks: {} as Record<string, string>,
  });
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    appointmentReminders: true,
    marketingEmails: false,
    weeklyDigest: true,
  });

  const navigationItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'account', label: 'Account', icon: SettingsIcon },
  ];

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
      } else {
        fetchProfile();
      }
    }
  }, [user, authLoading, router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profiles/my');
      if (response.ok) {
        const profiles = await response.json();
        if (profiles.length > 0) {
          const userProfile = profiles[0];
          setProfile(userProfile);
          setFormData({
            name: userProfile.name || '',
            email: userProfile.email || '',
            bio: userProfile.bio || '',
            skills: userProfile.skills || [],
            availableFor: userProfile.availableFor || [],
            linkedinUrl: userProfile.linkedinUrl || '',
            otherLinks: userProfile.otherLinks || {},
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    try {
      setSaving(true);
      const response = await fetch(`/api/profiles/${profile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          bio: formData.bio,
          skills: formData.skills,
          available_for: formData.availableFor,
          linkedin_url: formData.linkedinUrl,
          other_links: formData.otherLinks,
        }),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        // Show success message
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!profile || !confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/profiles/${profile.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProfile(null);
        router.push('/home');
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
  };

  const handlePrivacyUpdate = async (privacySettings: { isPublic: boolean; showInSearch: boolean; allowMeetingRequests: boolean }) => {
    if (!profile) return;

    try {
      const response = await fetch(`/api/profiles/${profile.id}/privacy`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublic: privacySettings.isPublic,
          isActive: privacySettings.allowMeetingRequests,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(prev => prev ? { ...prev, isPublic: data.profile.isPublic, isActive: data.profile.isActive } : null);
      } else {
        throw new Error('Failed to update privacy settings');
      }
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      throw error;
    }
  };

  const handleSlugUpdate = async (newSlug: string) => {
    if (!profile) return;

    try {
      const response = await fetch(`/api/profiles/${profile.id}/slug`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug: newSlug }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(prev => prev ? { ...prev, slug: data.slug } : null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update slug');
      }
    } catch (error) {
      console.error('Error updating slug:', error);
      throw error;
    }
  };

  const addSkill = (skill: string) => {
    if (skill.trim() && !formData.skills.includes(skill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()]
      }));
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const toggleAvailability = (type: string) => {
    setFormData(prev => ({
      ...prev,
      availableFor: prev.availableFor.includes(type)
        ? prev.availableFor.filter(item => item !== type)
        : [...prev.availableFor, type]
    }));
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (authLoading || loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-orange-600 text-lg">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex bg-white ml-16">
      {/* Left Sidebar Navigation */}
      <div className="w-64 flex-shrink-0 border-r border-gray-200 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your account
            </p>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarFallback className="bg-orange-600 text-white">
                {user?.firstName ? getUserInitials(user.firstName + ' ' + (user.lastName || '')) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-600 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                    ${isActive
                      ? 'bg-orange-50 text-orange-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 max-w-4xl">

        {activeSection === 'profile' && (
          <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your professional profile information visible to others
                  </CardDescription>
                </div>
                {profile && (
                  <PrivacyStatusIndicator 
                    privacyStatus={getPrivacyStatusFromProfile(profile)}
                    variant="compact"
                    showTooltip={true}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {!profile ? (
                <div className="text-center py-8">
                  <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No profile yet</h3>
                  <p className="text-gray-600 mb-4">Create your profile to get started</p>
                  <Button onClick={() => router.push('/profile/new')}>
                    Create Profile
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea 
                      id="bio" 
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell others about yourself and your expertise..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>Skills</Label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.skills.map((skill) => (
                        <Badge 
                          key={skill} 
                          variant="secondary" 
                          className="cursor-pointer hover:bg-red-100"
                          onClick={() => removeSkill(skill)}
                        >
                          {skill} ×
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Add a skill and press Enter"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addSkill(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <Button 
                        variant="outline" 
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          addSkill(input.value);
                          input.value = '';
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Available For</Label>
                    <div className="space-y-3">
                      {[
                        { id: 'meetings', label: 'Meetings', description: 'One-on-one or group discussions and collaborations' },
                      ].map((option) => (
                        <div key={option.id} className="flex items-center space-x-3">
                          <Checkbox
                            id={option.id}
                            checked={formData.availableFor.includes(option.id)}
                            onCheckedChange={() => toggleAvailability(option.id)}
                          />
                          <div className="flex-1">
                            <Label htmlFor={option.id} className="font-medium">
                              {option.label}
                            </Label>
                            <p className="text-sm text-gray-600">{option.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
                    <Input 
                      id="linkedinUrl" 
                      type="url"
                      value={formData.linkedinUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>Other Professional Links</Label>
                    <div className="space-y-2">
                      {Object.entries(formData.otherLinks).map(([name, url]) => (
                        <div key={name} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium">{name}:</span>
                          <span className="text-sm text-gray-600 flex-1">{url}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFormData(prev => {
                                const newLinks = { ...prev.otherLinks };
                                delete newLinks[name];
                                return { ...prev, otherLinks: newLinks };
                              });
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                      
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Link name"
                          className="flex-1"
                          id="newLinkName"
                        />
                        <Input 
                          placeholder="https://..."
                          className="flex-1"
                          type="url"
                          id="newLinkUrl"
                        />
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const nameInput = document.getElementById('newLinkName') as HTMLInputElement;
                            const urlInput = document.getElementById('newLinkUrl') as HTMLInputElement;
                            if (nameInput?.value && urlInput?.value) {
                              setFormData(prev => ({
                                ...prev,
                                otherLinks: {
                                  ...prev.otherLinks,
                                  [nameInput.value]: urlInput.value
                                }
                              }));
                              nameInput.value = '';
                              urlInput.value = '';
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleSaveProfile} disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={fetchProfile}>
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {profile && (
            <div className="space-y-6">
              <SlugEditor
                currentSlug={profile.slug}
                onUpdate={handleSlugUpdate}
                isLoading={loading}
                baseUrl={window.location.origin}
              />

              <ProfileUrlSharing
                slug={profile.slug}
                isPublic={profile.isPublic}
                profileUrl={`${window.location.origin}/${profile.slug}`}
                profileId={parseInt(profile.id)}
              />
            </div>
          )}
          </div>
        )}

        {activeSection === 'notifications' && (
          <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to be notified about meetings and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  {
                    key: 'emailNotifications',
                    label: 'Email Notifications',
                    description: 'Receive notifications via email',
                    icon: <Mail className="h-4 w-4" />
                  },
                  {
                    key: 'appointmentReminders',
                    label: 'Meeting Reminders',
                    description: 'Get reminded about upcoming meetings',
                    icon: <Bell className="h-4 w-4" />
                  },
                  {
                    key: 'marketingEmails',
                    label: 'Marketing Emails',
                    description: 'Receive updates about new features and tips',
                    icon: <Globe className="h-4 w-4" />
                  },
                  {
                    key: 'weeklyDigest',
                    label: 'Weekly Digest',
                    description: 'Get a summary of your weekly activity',
                    icon: <Mail className="h-4 w-4" />
                  },
                ].map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {setting.icon}
                      <div>
                        <Label className="font-medium">{setting.label}</Label>
                        <p className="text-sm text-gray-600">{setting.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications[setting.key as keyof typeof notifications]}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, [setting.key]: checked }))
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          </div>
        )}

        {activeSection === 'privacy' && (
          <div className="space-y-6">
          {profile ? (
            <PrivacySettingsComponent
              currentSettings={{
                isPublic: profile.isPublic,
                showInSearch: profile.isPublic && profile.isActive,
                allowMeetingRequests: profile.isPublic && profile.isActive
              }}
              onUpdate={handlePrivacyUpdate}
              loading={loading}
            />
          ) : (
            <div className="text-center py-8">
              <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No profile yet</h3>
              <p className="text-gray-600 mb-4">Create your profile to manage privacy settings</p>
              <Button onClick={() => router.push('/profile/new')}>
                Create Profile
              </Button>
            </div>
          )}
          </div>
        )}

        {activeSection === 'account' && (
          <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your account and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Lock className="h-5 w-5 text-gray-400" />
                    <div>
                      <Label className="font-medium">Authentication</Label>
                      <p className="text-sm text-gray-600">Managed by WorkOS</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <Label className="font-medium">Account Type</Label>
                      <p className="text-sm text-gray-600">Professional</p>
                    </div>
                  </div>
                  <Badge variant="outline">Free</Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-red-900">Danger Zone</h3>
                
                {profile && (
                  <Card className="border-red-200">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                          <div>
                            <Label className="font-medium text-red-900">Delete Profile</Label>
                            <p className="text-sm text-red-700">
                              Permanently delete your profile and all associated data. This action cannot be undone.
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={handleDeleteProfile}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}