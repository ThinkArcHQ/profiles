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
    <div className="fixed inset-0 flex bg-gray-50 ml-16">
      {/* Left Sidebar Navigation */}
      <div className="w-72 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-sm text-gray-500">
              Manage your account preferences
            </p>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl border border-orange-100">
            <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-white">
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-base font-semibold">
                {user?.firstName ? getUserInitials(user.firstName + ' ' + (user.lastName || '')) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-600 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200
                    ${isActive
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 scale-[1.02]'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className={`${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-6 max-w-5xl mx-auto">

        {activeSection === 'profile' && (
          <div className="space-y-6">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100 bg-white pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <User className="h-6 w-6 text-orange-600" />
                    Profile Information
                  </CardTitle>
                  <CardDescription className="mt-1.5">
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
            <CardContent className="space-y-8 pt-6">
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
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Your full name"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your@email.com"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-sm font-semibold text-gray-700">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell others about yourself and your expertise..."
                      rows={5}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">Skills</Label>
                    <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[60px]">
                      {formData.skills.length === 0 ? (
                        <span className="text-sm text-gray-400">No skills added yet</span>
                      ) : (
                        formData.skills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="px-3 py-1.5 bg-orange-100 text-orange-700 hover:bg-red-100 hover:text-red-700 cursor-pointer transition-colors"
                            onClick={() => removeSkill(skill)}
                          >
                            {skill} <span className="ml-1 text-lg leading-none">×</span>
                          </Badge>
                        ))
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a skill and press Enter"
                        className="h-11"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addSkill(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        className="px-6"
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

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">Available For</Label>
                    <div className="space-y-3">
                      {[
                        { id: 'meetings', label: 'Meetings', description: 'One-on-one or group discussions and collaborations' },
                      ].map((option) => (
                        <div key={option.id} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <Checkbox
                            id={option.id}
                            checked={formData.availableFor.includes(option.id)}
                            onCheckedChange={() => toggleAvailability(option.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <Label htmlFor={option.id} className="font-semibold text-gray-900 cursor-pointer">
                              {option.label}
                            </Label>
                            <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedinUrl" className="text-sm font-semibold text-gray-700">LinkedIn Profile</Label>
                    <Input
                      id="linkedinUrl"
                      type="url"
                      value={formData.linkedinUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="h-11"
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

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30 h-11 px-6"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={fetchProfile} className="h-11 px-6">
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
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100 bg-white pb-6">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Bell className="h-6 w-6 text-orange-600" />
                Notification Preferences
              </CardTitle>
              <CardDescription className="mt-1.5">
                Choose how you want to be notified about meetings and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-3">
                {[
                  {
                    key: 'emailNotifications',
                    label: 'Email Notifications',
                    description: 'Receive notifications via email',
                    icon: <Mail className="h-5 w-5 text-gray-400" />
                  },
                  {
                    key: 'appointmentReminders',
                    label: 'Meeting Reminders',
                    description: 'Get reminded about upcoming meetings',
                    icon: <Bell className="h-5 w-5 text-gray-400" />
                  },
                  {
                    key: 'marketingEmails',
                    label: 'Marketing Emails',
                    description: 'Receive updates about new features and tips',
                    icon: <Globe className="h-5 w-5 text-gray-400" />
                  },
                  {
                    key: 'weeklyDigest',
                    label: 'Weekly Digest',
                    description: 'Get a summary of your weekly activity',
                    icon: <Mail className="h-5 w-5 text-gray-400" />
                  },
                ].map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-4">
                      <div className="mt-0.5">{setting.icon}</div>
                      <div>
                        <Label className="font-semibold text-gray-900">{setting.label}</Label>
                        <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
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
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100 bg-white pb-6">
              <CardTitle className="flex items-center gap-2 text-xl">
                <SettingsIcon className="h-6 w-6 text-orange-600" />
                Account Settings
              </CardTitle>
              <CardDescription className="mt-1.5">
                Manage your account and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-5 border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-shadow">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Lock className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <Label className="font-semibold text-gray-900">Authentication</Label>
                      <p className="text-sm text-gray-600 mt-0.5">Managed by WorkOS</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-5 border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-shadow">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <Label className="font-semibold text-gray-900">Account Type</Label>
                      <p className="text-sm text-gray-600 mt-0.5">Professional</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-gray-300">Free</Badge>
                </div>
              </div>

              <Separator className="my-8" />

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
                  <p className="text-sm text-red-600 mt-1">Irreversible actions that affect your account</p>
                </div>

                {profile && (
                  <Card className="border-2 border-red-200 bg-red-50/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start space-x-4">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <Label className="font-semibold text-red-900 text-base">Delete Profile</Label>
                            <p className="text-sm text-red-700 mt-1">
                              Permanently delete your profile and all associated data. This action cannot be undone.
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDeleteProfile}
                          className="flex-shrink-0 h-10 shadow-lg"
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