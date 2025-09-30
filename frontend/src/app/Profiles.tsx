'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
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
    <main className="bg-gray-50 py-16" id="profiles">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Discover Profiles
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Connect with talented individuals ready to be discovered by AI agents worldwide.
              </p>
            </div>

            <div className="max-w-xl mx-auto relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <Input
                type="text"
                placeholder="Search profiles by name, skills, or expertise..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-base border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProfiles.map((profile) => (
                    <Link 
                      key={profile.id} 
                      href={`/${profile.slug}`}
                      className="group block"
                    >
                      <Card className="group-hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-gray-300 bg-white rounded-lg overflow-hidden cursor-pointer">
                        {/* Profile Image */}
                        <div className="relative h-32 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                          <div className="text-white font-bold text-2xl">
                            {profile.name.charAt(0).toUpperCase()}
                          </div>
                          {/* Available Status Badge */}
                          <div className="absolute top-2 right-2 flex items-center bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-1.5"></div>
                            <span className="text-xs text-gray-700 font-medium">Available</span>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          {/* Name */}
                          <div className="mb-3">
                            <h3 className="font-semibold text-gray-900 text-base">
                              {profile.name}
                            </h3>
                          </div>

                          {/* Bio Preview */}
                          {profile.bio && (
                            <p className="text-gray-600 text-xs leading-relaxed mb-3 line-clamp-2">
                              {profile.bio}
                            </p>
                          )}

                          {/* Available For - Simplified */}
                          {profile.availableFor.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {profile.availableFor.slice(0, 2).map((item, index) => (
                                <span
                                  key={`available-${index}`}
                                  className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded font-medium capitalize"
                                >
                                  {item}
                                </span>
                              ))}
                              {profile.availableFor.length > 2 && (
                                <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs rounded font-medium">
                                  +{profile.availableFor.length - 2} more
                                </span>
                              )}
                            </div>
                          )}

                          {/* Single Action Button */}
                          <div className="pt-2 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                Click to view profile
                              </span>
                              <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
    </main>
  );
}
