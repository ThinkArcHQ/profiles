'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SearchProfiles } from '@/components/search-profiles';
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  Quote, 
  Send, 
  Plus,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  skills: string[];
  bio: string;
  available_for: string[];
  created_at: string;
  updated_at: string;
}

interface AppointmentRequest {
  id: string;
  profile_id: string;
  requester_name: string;
  requester_email: string;
  message: string;
  preferred_time?: string;
  request_type: string;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [meetingRequests, setMeetingRequests] = useState<AppointmentRequest[]>([]);
  const [quoteRequests, setQuoteRequests] = useState<AppointmentRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProfiles: 0,
    pendingRequests: 0,
    acceptedRequests: 0,
    sentRequests: 0
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
      } else {
        fetchData();
        fetchStats();
      }
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
    try {
      // Fetch user's profile (single profile per user)
      const profilesResponse = await fetch('/api/profiles/my');
      if (profilesResponse.ok) {
        const profilesData = await profilesResponse.json();
        setProfile(profilesData.length > 0 ? profilesData[0] : null);
      }

      // Fetch received requests and separate them
      const requestsResponse = await fetch('/api/appointments/received');
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        setMeetingRequests(requestsData.filter((req: AppointmentRequest) => req.request_type === 'meeting'));
        setQuoteRequests(requestsData.filter((req: AppointmentRequest) => req.request_type === 'quote'));
      }

      // Fetch sent requests
      const sentResponse = await fetch('/api/appointments/sent');
      if (sentResponse.ok) {
        const sentData = await sentResponse.json();
        setSentRequests(sentData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get total profiles count
      const profilesResponse = await fetch('/api/profiles');
      if (profilesResponse.ok) {
        const profilesData = await profilesResponse.json();
        setStats(prev => ({ ...prev, totalProfiles: profilesData.length }));
      }

      // Get request stats
      const receivedResponse = await fetch('/api/appointments/received');
      if (receivedResponse.ok) {
        const receivedData = await receivedResponse.json();
        const pending = receivedData.filter((req: AppointmentRequest) => req.status === 'pending').length;
        const accepted = receivedData.filter((req: AppointmentRequest) => req.status === 'accepted').length;
        setStats(prev => ({ ...prev, pendingRequests: pending, acceptedRequests: accepted }));
      }

      const sentResponse = await fetch('/api/appointments/sent');
      if (sentResponse.ok) {
        const sentData = await sentResponse.json();
        setStats(prev => ({ ...prev, sentRequests: sentData.length }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleStatusUpdate = async (requestId: string, status: string) => {
    try {
      const response = await fetch(`/api/appointments/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        // Refresh data after status update
        fetchData();
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-orange-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Discover professionals and manage your connections
          </p>
        </div>
        {!profile && (
          <Button asChild>
            <Link href="/profile/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Profile
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profiles</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProfiles}</div>
            <p className="text-xs text-muted-foreground">
              Available for discovery
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting your response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted Requests</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.acceptedRequests}</div>
            <p className="text-xs text-muted-foreground">
              Successful connections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent Requests</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sentRequests}</div>
            <p className="text-xs text-muted-foreground">
              Your outreach efforts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="discover" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="discover">Discover Profiles</TabsTrigger>
          <TabsTrigger value="meetings" id="meetings">
            Meeting Requests ({meetingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="quotes" id="quotes">
            Quote Requests ({quoteRequests.length})
          </TabsTrigger>
          <TabsTrigger value="sent" id="sent">
            Sent Requests ({sentRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Discover Professionals
              </CardTitle>
              <CardDescription>
                Search and connect with professionals in your field or find experts for your projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SearchProfiles limit={6} />
              <div className="mt-6 text-center">
                <Button asChild variant="outline">
                  <Link href="/profiles">
                    View All Profiles
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meetings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Meeting Requests
              </CardTitle>
              <CardDescription>
                Requests for meetings and consultations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {meetingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No meeting requests</h3>
                  <p className="text-gray-600">Meeting requests will appear here when received</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {meetingRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{request.requester_name}</h4>
                          <p className="text-sm text-gray-600">{request.requester_email}</p>
                        </div>
                        <Badge variant={request.status === 'pending' ? 'secondary' : 
                                     request.status === 'accepted' ? 'default' : 'destructive'}>
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-sm mb-3">{request.message}</p>
                      {request.preferred_time && (
                        <p className="text-sm text-gray-600 mb-3">
                          Preferred time: {new Date(request.preferred_time).toLocaleString()}
                        </p>
                      )}
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleStatusUpdate(request.id, 'accepted')}
                          >
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStatusUpdate(request.id, 'rejected')}
                          >
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Quote className="h-5 w-5" />
                Quote Requests
              </CardTitle>
              <CardDescription>
                Requests for project quotes and estimates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {quoteRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Quote className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No quote requests</h3>
                  <p className="text-gray-600">Quote requests will appear here when received</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quoteRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{request.requester_name}</h4>
                          <p className="text-sm text-gray-600">{request.requester_email}</p>
                        </div>
                        <Badge variant={request.status === 'pending' ? 'secondary' : 
                                     request.status === 'accepted' ? 'default' : 'destructive'}>
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-sm mb-3">{request.message}</p>
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleStatusUpdate(request.id, 'accepted')}
                          >
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStatusUpdate(request.id, 'rejected')}
                          >
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Sent Requests
              </CardTitle>
              <CardDescription>
                Requests you've sent to other professionals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sentRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Send className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No sent requests</h3>
                  <p className="text-gray-600">Requests you send will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sentRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">Request to {request.requester_name}</h4>
                          <p className="text-sm text-gray-600">{request.request_type}</p>
                        </div>
                        <Badge variant={request.status === 'pending' ? 'secondary' : 
                                     request.status === 'accepted' ? 'default' : 'destructive'}>
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{request.message}</p>
                      <p className="text-xs text-gray-500">
                        Sent on {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}