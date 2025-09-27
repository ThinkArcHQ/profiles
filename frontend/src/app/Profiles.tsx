'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

export default function Profiles() {
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

  return (
    <main className="bg-gray-50 py-24" id="profiles">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-black mb-6">
                Featured Profiles
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Discover talented individuals who are ready to be found by AI agents worldwide.
              </p>
            </div>

            <div className="max-w-2xl mx-auto relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name, skills, services, or expertise..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-white border border-orange-200 rounded-2xl shadow-lg focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 text-lg placeholder-gray-400 transition-all duration-300"
              />
            </div>
          </div>

          {/* Profiles Grid */}
          {loading ? (
            <div className="text-center py-16">
              <div className="relative inline-flex">
                <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-orange-600 to-orange-700 rounded-full animate-pulse"></div>
              </div>
              <p className="mt-6 text-gray-600 text-lg">Loading registered profiles...</p>
            </div>
          ) : (
            <>
              <div className="mb-12">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-black">
                      {searchTerm ? `Search Results (${filteredProfiles.length})` : `Featured Profiles (${profiles.length})`}
                    </h2>
                    {searchTerm && (
                      <p className="text-gray-600 mt-2">
                        Showing results for &quot;{searchTerm}&quot;
                      </p>
                    )}
                  </div>

                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="mt-4 sm:mt-0 inline-flex items-center text-orange-600 hover:text-orange-700 font-medium transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear search
                    </button>
                  )}
                </div>
              </div>

              {filteredProfiles.length === 0 ? (
                <div className="text-center py-20">
                  <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mb-6">
                    <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-4">
                    {searchTerm ? 'No profiles found' : 'No profiles registered yet'}
                  </h3>
                  <p className="text-gray-600 text-lg max-w-md mx-auto mb-8">
                    {searchTerm 
                      ? 'Try adjusting your search terms or browse all available profiles.' 
                      : 'Be the first to create your profile and get discovered by AI agents looking for talent like yours.'
                    }
                  </p>
                  {!searchTerm && (
                    <Link
                      href="/profile/new"
                      className="inline-flex items-center bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-300"
                    >
                      Register Your Profile
                      <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {filteredProfiles.map((profile) => (
                    <div key={profile.id} className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-200 hover:border-orange-300 transform hover:-translate-y-2">
                      <div className="p-8">
                        <div className="flex items-center space-x-4 mb-6">
                          <div className="relative">
                            <div className="h-16 w-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                              <span className="text-white font-bold text-2xl">
                                {profile.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="absolute -bottom-2 -right-2 h-6 w-6 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-black group-hover:text-orange-600 transition-colors">{profile.name}</h3>
                            <p className="text-gray-500 font-medium">{profile.email}</p>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-6 leading-relaxed line-clamp-3">{profile.bio}</p>
                        
                        <div className="mb-6">
                          <h4 className="text-sm font-bold text-black mb-3 uppercase tracking-wide">Skills & Expertise</h4>
                          <div className="flex flex-wrap gap-2">
                            {profile.skills.slice(0, 3).map((skill, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200"
                              >
                                {skill}
                              </span>
                            ))}
                            {profile.skills.length > 3 && (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600">
                                +{profile.skills.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mb-8">
                          <h4 className="text-sm font-bold text-black mb-3 uppercase tracking-wide">Available For</h4>
                          <div className="flex flex-wrap gap-2">
                            {profile.available_for.map((service, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-black text-white border border-gray-800"
                              >
                                {service.charAt(0).toUpperCase() + service.slice(1)}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-green-600 font-medium">
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Available for AI Discovery
                          </div>
                          <Link
                            href={`/request/${profile.id}`}
                            className="group/btn flex items-center justify-center bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-lg shadow-orange-500/25"
                          >
                            Connect
                            <svg className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
  )
}
