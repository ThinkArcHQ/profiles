'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PublicProfile } from '@/lib/types/profile';

export default function Profiles() {
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      // Use search endpoint to get public profiles with slugs
      const response = await fetch('/api/search');
      const data = await response.json();
      setProfiles(data.profiles || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = profiles.filter(profile =>
    profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (profile.bio && profile.bio.toLowerCase().includes(searchTerm.toLowerCase())) ||
    profile.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <main className="bg-white py-24" id="profiles">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-orange-900 mb-6">
                Featured Profiles
              </h2>
              <p className="text-xl text-orange-700 max-w-2xl mx-auto">
                Discover talented individuals who are ready to be found by AI agents worldwide.
              </p>
            </div>

            <div className="max-w-2xl mx-auto relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <Input
                type="text"
                placeholder="Search by name, skills, services, or expertise..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-4 text-lg rounded-2xl shadow-lg"
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
              <p className="mt-6 text-orange-600 text-lg">Loading registered profiles...</p>
            </div>
          ) : (
            <>
              <div className="mb-12">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-orange-900">
                      {searchTerm ? `Search Results (${filteredProfiles.length})` : `Featured Profiles (${profiles.length})`}
                    </h2>
                    {searchTerm && (
                      <p className="text-orange-600 mt-2">
                        Showing results for &quot;{searchTerm}&quot;
                      </p>
                    )}
                  </div>

                  {searchTerm && (
                    <Button
                      variant="outline"
                      onClick={() => setSearchTerm('')}
                      className="mt-4 sm:mt-0"
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              </div>

              {filteredProfiles.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-orange-900 mb-4">
                    {searchTerm ? 'No profiles found' : 'No profiles yet'}
                  </h3>
                  <p className="text-orange-600 mb-8 max-w-md mx-auto">
                    {searchTerm 
                      ? 'Try adjusting your search terms or browse all profiles.' 
                      : 'Be the first to register your profile and get discovered by AI agents worldwide.'
                    }
                  </p>
                  <Button asChild>
                    <Link href="/profile/new">
                      Register Your Profile
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredProfiles.map((profile) => (
                    <Card key={profile.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-2">{profile.name}</CardTitle>
                            <CardDescription className="text-sm">
                              {profile.email}
                            </CardDescription>
                          </div>
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {profile.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <p className="text-orange-700 mb-4 line-clamp-3">
                          {profile.bio}
                        </p>

                        {/* Skills */}
                        {profile.skills.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-orange-900 mb-2">Skills</h4>
                            <div className="flex flex-wrap gap-2">
                              {profile.skills.slice(0, 3).map((skill, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full font-medium"
                                >
                                  {skill}
                                </span>
                              ))}
                              {profile.skills.length > 3 && (
                                <span className="px-3 py-1 bg-orange-50 text-orange-600 text-sm rounded-full font-medium">
                                  +{profile.skills.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Available For */}
                        {profile.availableFor.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-sm font-semibold text-orange-900 mb-2">Available For</h4>
                            <div className="flex flex-wrap gap-2">
                              {profile.availableFor.map((item, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm rounded-full font-medium capitalize"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <Button asChild className="flex-1">
                            <Link href={`/profiles/${profile.slug}`}>
                              View Profile
                            </Link>
                          </Button>
                          <Button variant="outline" asChild>
                            <Link href={`/request/${profile.id}`}>
                              Request Meeting
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
    </main>
  );
}
