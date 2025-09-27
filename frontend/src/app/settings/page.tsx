'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-orange-900">Settings</h1>
        <p className="text-orange-700 mt-2">
          Manage your account preferences and privacy settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-orange-900">Profile Information</CardTitle>
              <CardDescription>
                Update your basic profile information visible to AI agents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio" 
                  placeholder="Tell AI agents about yourself..."
                  rows={4}
                />
              </div>
              <Button>Save Profile</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-orange-900">Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified about requests and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="emailMeetings" />
                  <Label htmlFor="emailMeetings">Email notifications for meeting requests</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="emailQuotes" />
                  <Label htmlFor="emailQuotes">Email notifications for quote requests</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="emailStatusUpdates" />
                  <Label htmlFor="emailStatusUpdates">Email notifications for status updates</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="browserNotifications" />
                  <Label htmlFor="browserNotifications">Browser push notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="weeklyDigest" />
                  <Label htmlFor="weeklyDigest">Weekly activity digest</Label>
                </div>
              </div>
              <Button>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-orange-900">Privacy Settings</CardTitle>
              <CardDescription>
                Control your visibility and data sharing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Profile Visibility</Label>
                    <p className="text-sm text-orange-600">Who can discover your profile</p>
                  </div>
                  <Badge variant="outline">All AI Agents</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="showEmail" />
                  <Label htmlFor="showEmail">Show email in public profile</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="allowDirectContact" />
                  <Label htmlFor="allowDirectContact">Allow direct contact without requests</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="shareAnalytics" />
                  <Label htmlFor="shareAnalytics">Share anonymous usage analytics</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="mcpDiscovery" />
                  <Label htmlFor="mcpDiscovery">Enable MCP protocol discovery</Label>
                </div>
              </div>
              <Button>Update Privacy Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-orange-900">Account Management</CardTitle>
              <CardDescription>
                Manage your account security and data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Change Password</Label>
                    <p className="text-sm text-orange-600">Update your account password</p>
                  </div>
                  <Button variant="outline">Change Password</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-orange-600">Add an extra layer of security</p>
                  </div>
                  <Badge variant="outline">Disabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Export Data</Label>
                    <p className="text-sm text-orange-600">Download your profile data</p>
                  </div>
                  <Button variant="outline">Export</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Delete Account</Label>
                    <p className="text-sm text-orange-600">Permanently delete your account and data</p>
                  </div>
                  <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}