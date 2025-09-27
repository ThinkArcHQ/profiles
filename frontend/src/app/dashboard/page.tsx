'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { signOut } from '@workos-inc/authkit-nextjs';

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
  const [activeTab, setActiveTab] = useState<'profiles' | 'requests'>('profiles');

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
      setLoading(true);
      
      // Fetch user's profiles
      const profilesResponse = await fetch('http://localhost:8000/profiles/my', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (profilesResponse.ok) {
        const profilesData = await profilesResponse.json();
        setProfiles(profilesData);
      }

      // Fetch received appointment requests
      const requestsResponse = await fetch('http://localhost:8000/appointments/received', {
        headers: {
          'Content-Type': 'application/json',
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

  const handleRequestAction = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      const response = await fetch(`http://localhost:8000/appointments/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        // Refresh the requests
        fetchData();
      } else {
        alert('Failed to update request status');
      }
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Failed to update request status');
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">FB</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Profiles by FinderBee</h1>
              </Link>
              <p className="text-gray-600 mt-1">Welcome back, {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/profile/new"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Profile
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profiles')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profiles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Profiles ({profiles.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Requests ({requests.filter(r => r.status === 'pending').length})
            </button>
          </nav>
        </div>

        {/* Profiles Tab */}
        {activeTab === 'profiles' && (
          <div>
            {profiles.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-24 w-24 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-400 text-2xl">👤</span>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No profiles yet</h3>
                <p className="mt-2 text-gray-500">Create your first profile to start receiving appointment requests.</p>
                <Link
                  href="/profile/new"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Profile
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {profiles.map((profile) => (
                  <div key={profile.id} className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900">{profile.name}</h3>
                    <p className="text-gray-600 mt-1">{profile.email}</p>
                    <p className="text-gray-700 mt-3 text-sm">{profile.bio}</p>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900">Skills:</h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {profile.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900">Available for:</h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {profile.available_for.map((service, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div>
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-24 w-24 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-400 text-2xl">📋</span>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No requests yet</h3>
                <p className="mt-2 text-gray-500">When people request appointments or quotes, they&apos;ll appear here.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {requests.map((request) => {
                  const profile = profiles.find(p => p.id === request.profile_id);
                  return (
                    <div key={request.id} className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {request.request_type.charAt(0).toUpperCase() + request.request_type.slice(1)} Request
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {request.status}
                            </span>
                          </div>
                          
                          <p className="text-gray-600 mt-1">
                            For profile: <strong>{profile?.name || 'Unknown Profile'}</strong>
                          </p>
                          
                          <div className="mt-3">
                            <h4 className="text-sm font-medium text-gray-900">From:</h4>
                            <p className="text-gray-700">{request.requester_name} ({request.requester_email})</p>
                          </div>

                          <div className="mt-3">
                            <h4 className="text-sm font-medium text-gray-900">Message:</h4>
                            <p className="text-gray-700">{request.message}</p>
                          </div>

                          {request.preferred_time && (
                            <div className="mt-3">
                              <h4 className="text-sm font-medium text-gray-900">Preferred Time:</h4>
                              <p className="text-gray-700">{request.preferred_time}</p>
                            </div>
                          )}

                          <p className="text-xs text-gray-500 mt-3">
                            Received: {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        {request.status === 'pending' && (
                          <div className="ml-4 flex space-x-2">
                            <button
                              onClick={() => handleRequestAction(request.id, 'accepted')}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRequestAction(request.id, 'rejected')}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}