'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

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

export default function Home() {
  const { user, logout } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await fetch('http://localhost:8000/profiles');
      const data = await response.json();
      setProfiles(data);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = profiles.filter(profile =>
    profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">FB</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Profiles by FinderBee</h1>
                <p className="text-gray-600 mt-1">Reimagining Connections in the Era of AI</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/profile/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Profile
                  </Link>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Welcome, {user.name}</span>
                    <button
                      onClick={handleLogout}
                      className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/profile/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Profile
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl font-extrabold sm:text-5xl">
              Connect with AI-Powered Professionals
            </h2>
            <p className="mt-6 text-xl">
              Discover experts, schedule appointments, request quotes, and arrange meetings 
              through our AI-integrated platform. Where human expertise meets artificial intelligence.
            </p>
            <div className="mt-8 flex justify-center space-x-4">
              <Link
                href="#profiles"
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Browse Profiles
              </Link>
              {!user && (
                <Link
                  href="/login"
                  className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" id="profiles">
        {/* Search */}
        <div className="mb-12">
          <div className="max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search profiles by name, skills, or bio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>
        </div>

        {/* Profiles Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profiles...</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                {searchTerm ? `Search Results (${filteredProfiles.length})` : `All Profiles (${profiles.length})`}
              </h2>
              {searchTerm && (
                <p className="text-gray-600 mt-1">
                  Showing results for "{searchTerm}"
                </p>
              )}
            </div>

            {filteredProfiles.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-24 w-24 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-400 text-2xl">🔍</span>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {searchTerm ? 'No profiles found' : 'No profiles yet'}
                </h3>
                <p className="mt-2 text-gray-500">
                  {searchTerm 
                    ? 'Try adjusting your search terms or browse all profiles.' 
                    : 'Be the first to create a profile and start connecting with others.'
                  }
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-4 text-blue-600 hover:text-blue-500"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {filteredProfiles.map((profile) => (
                  <div key={profile.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {profile.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{profile.name}</h3>
                          <p className="text-gray-600 text-sm">{profile.email}</p>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-4 line-clamp-3">{profile.bio}</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Skills:</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.skills.slice(0, 3).map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {skill}
                            </span>
                          ))}
                          {profile.skills.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{profile.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Available for:</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.available_for.map((service, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                            >
                              {service.charAt(0).toUpperCase() + service.slice(1)}
                            </span>
                          ))}
                        </div>
                      </div>

                      <Link
                        href={`/request/${profile.id}`}
                        className="w-full block text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Request Connection
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-2 mb-4">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">FB</span>
              </div>
              <h3 className="text-xl font-bold">Profiles by FinderBee</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Reimagining Connections in the Era of AI
            </p>
            <p className="text-gray-500 text-sm">
              Connect with professionals through AI-powered networking. 
              Schedule appointments, request quotes, and arrange meetings seamlessly.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
