'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

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
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // Handle URL fragments for tab navigation
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'meetings' || hash === 'quotes' || hash === 'sent') {
        setActiveTab(hash);
      } else {
        setActiveTab('profile');
      }
    };

    // Set initial tab based on URL
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

      // Fetch user's profile (single profile per user)
      const profilesResponse = await fetch('http://localhost:8000/profiles/my', {
        headers,
      });
      if (profilesResponse.ok) {
        const profilesData = await profilesResponse.json();
        setProfile(profilesData.length > 0 ? profilesData[0] : null);
      }

      // Fetch received requests and separate them
      const requestsResponse = await fetch('http://localhost:8000/appointments/received', {
        headers,
      });
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        setMeetingRequests(requestsData.filter((req: AppointmentRequest) => req.request_type === 'meeting'));
        setQuoteRequests(requestsData.filter((req: AppointmentRequest) => req.request_type === 'quote'));
      }

      // Fetch sent requests
      const sentResponse = await fetch('http://localhost:8000/appointments/sent', {
        headers,
      });
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

  const handleStatusUpdate = async (requestId: string, status: string) => {
    try {
      const response = await fetch(`http://localhost:8000/appointments/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        // Refresh requests
        fetchData();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-orange-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-orange-900 mb-2">Dashboard</h1>
        <p className="text-orange-700">Manage your profile and connection requests</p>
      </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="meetings">Meeting Requests</TabsTrigger>
          <TabsTrigger value="quotes">Quote Requests</TabsTrigger>
          <TabsTrigger value="sent">Sent Requests</TabsTrigger>
        </TabsList>          <TabsContent value="profile" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-orange-900">Your Profile</h2>
              {profile ? (
                <Button asChild variant="outline">
                  <Link href={`/profile/${profile.id}`}>Edit Profile</Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/profile/new">Create Profile</Link>
                </Button>
              )}
            </div>

            {!profile ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-orange-900 mb-2">No profile yet</h3>
                  <p className="text-orange-600 text-center mb-6 max-w-md">
                    Create your profile to start getting discovered by AI agents worldwide.
                  </p>
                  <Button asChild>
                    <Link href="/profile/new">Create Your Profile</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl text-orange-900">{profile.name}</CardTitle>
                      <CardDescription>{profile.email}</CardDescription>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-orange-700 mb-4">{profile.bio}</p>
                  
                  {profile.skills.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-orange-900 mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.available_for.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-orange-900 mb-2">Available For</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.available_for.map((item: string, index: number) => (
                          <Badge key={index} className="capitalize">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button asChild className="flex-1">
                      <Link href={`/profile/${profile.id}`}>View Public Profile</Link>
                    </Button>
                    <Button variant="outline" asChild className="flex-1">
                      <Link href={`/profile/${profile.id}`}>Edit Profile</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="meetings" className="space-y-6">
            <h2 className="text-2xl font-semibold text-orange-900">Meeting Requests</h2>

            {meetingRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-orange-900 mb-2">No meeting requests yet</h3>
                  <p className="text-orange-600 text-center max-w-md">
                    When AI agents discover your profile, meeting requests will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {meetingRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg text-orange-900">
                            {request.requester_name}
                          </CardTitle>
                          <CardDescription>{request.requester_email}</CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={request.status === 'pending' ? 'secondary' : 'default'}>
                            {request.status}
                          </Badge>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Meeting
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-orange-700 mb-4">{request.message}</p>
                      
                      {request.preferred_time && (
                        <p className="text-sm text-orange-600 mb-4">
                          <strong>Preferred Time:</strong> {request.preferred_time}
                        </p>
                      )}

                      {request.status === 'pending' && (
                        <div className="flex space-x-3">
                          <Button 
                            onClick={() => handleStatusUpdate(request.id, 'accepted')}
                            className="flex-1"
                          >
                            Accept Meeting
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => handleStatusUpdate(request.id, 'rejected')}
                            className="flex-1"
                          >
                            Decline
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="quotes" className="space-y-6">
            <h2 className="text-2xl font-semibold text-orange-900">Quote Requests</h2>

            {quoteRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-orange-900 mb-2">No quote requests yet</h3>
                  <p className="text-orange-600 text-center max-w-md">
                    When AI agents need quotes for your services, requests will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {quoteRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg text-orange-900">
                            {request.requester_name}
                          </CardTitle>
                          <CardDescription>{request.requester_email}</CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={request.status === 'pending' ? 'secondary' : 'default'}>
                            {request.status}
                          </Badge>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Quote
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-orange-700 mb-4">{request.message}</p>
                      
                      {request.preferred_time && (
                        <p className="text-sm text-orange-600 mb-4">
                          <strong>Deadline:</strong> {request.preferred_time}
                        </p>
                      )}

                      {request.status === 'pending' && (
                        <div className="flex space-x-3">
                          <Button 
                            onClick={() => handleStatusUpdate(request.id, 'accepted')}
                            className="flex-1"
                          >
                            Accept Quote Request
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => handleStatusUpdate(request.id, 'rejected')}
                            className="flex-1"
                          >
                            Decline
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-6">
            <h2 className="text-2xl font-semibold text-orange-900">Sent Requests</h2>

            {sentRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-orange-900 mb-2">No sent requests yet</h3>
                  <p className="text-orange-600 text-center max-w-md">
                    Requests you send to other profiles will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sentRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg text-orange-900">
                            Request to: {request.requester_name}
                          </CardTitle>
                          <CardDescription>{request.requester_email}</CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={request.status === 'pending' ? 'secondary' : 
                                        request.status === 'accepted' ? 'default' : 'destructive'}>
                            {request.status}
                          </Badge>
                          <Badge variant="outline" className={
                            request.request_type === 'meeting' 
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-green-50 text-green-700 border-green-200"
                          }>
                            {request.request_type}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-orange-700 mb-4">{request.message}</p>
                      
                      {request.preferred_time && (
                        <p className="text-sm text-orange-600 mb-4">
                          <strong>Preferred Time:</strong> {request.preferred_time}
                        </p>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-orange-600">
                          Sent: {new Date(request.created_at).toLocaleDateString()}
                        </span>
                        {request.status === 'pending' && (
                          <Badge variant="outline" className="text-yellow-700">
                            Awaiting Response
                          </Badge>
                        )}
                        {request.status === 'accepted' && (
                          <Badge className="bg-green-600 text-white">
                            Accepted ✓
                          </Badge>
                        )}
                        {request.status === 'rejected' && (
                          <Badge variant="destructive">
                            Declined
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
    </div>
  );
}