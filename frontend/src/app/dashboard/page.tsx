'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { signOut } from '@workos-inc/authkit-nextjs';
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
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
    try {
      // Fetch profiles
      const profilesResponse = await fetch('http://localhost:8000/profiles/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (profilesResponse.ok) {
        const profilesData = await profilesResponse.json();
        setProfiles(profilesData);
      }

      // Fetch requests
      const requestsResponse = await fetch('http://localhost:8000/appointments/received', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        setRequests(requestsData);
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-orange-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-orange-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-orange-900">
                Profiles
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-orange-700">Welcome, {user?.firstName}</span>
              <Button variant="outline" onClick={() => signOut()}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-orange-900 mb-2">Dashboard</h1>
          <p className="text-orange-700">Manage your profiles and connection requests</p>
        </div>

        <Tabs defaultValue="profiles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profiles">My Profiles ({profiles.length})</TabsTrigger>
            <TabsTrigger value="requests">Requests ({requests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="profiles" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-orange-900">Your Profiles</h2>
              <Button asChild>
                <Link href="/profile/new">Create New Profile</Link>
              </Button>
            </div>

            {profiles.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-orange-900 mb-2">No profiles yet</h3>
                  <p className="text-orange-600 text-center mb-6 max-w-md">
                    Create your first profile to start getting discovered by AI agents worldwide.
                  </p>
                  <Button asChild>
                    <Link href="/profile/new">Create Your First Profile</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {profiles.map((profile) => (
                  <Card key={profile.id} className="hover:shadow-lg transition-shadow">
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
                      <p className="text-orange-700 mb-4 line-clamp-3">{profile.bio}</p>
                      
                      {profile.skills.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-orange-900 mb-2">Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {profile.skills.slice(0, 3).map((skill, index) => (
                              <Badge key={index} variant="secondary">
                                {skill}
                              </Badge>
                            ))}
                            {profile.skills.length > 3 && (
                              <Badge variant="outline">
                                +{profile.skills.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {profile.available_for.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-orange-900 mb-2">Available For</h4>
                          <div className="flex flex-wrap gap-2">
                            {profile.available_for.map((item, index) => (
                              <Badge key={index} className="capitalize">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button variant="outline" asChild className="w-full">
                        <Link href={`/profile/${profile.id}`}>View Profile</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <h2 className="text-2xl font-semibold text-orange-900">Connection Requests</h2>

            {requests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-4.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-orange-900 mb-2">No requests yet</h3>
                  <p className="text-orange-600 text-center max-w-md">
                    When AI agents discover your profiles, connection requests will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
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
                          <Badge variant="outline" className="capitalize">
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

                      {request.status === 'pending' && (
                        <div className="flex space-x-3">
                          <Button 
                            onClick={() => handleStatusUpdate(request.id, 'accepted')}
                            className="flex-1"
                          >
                            Accept
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
        </Tabs>
      </div>
    </div>
  );
}