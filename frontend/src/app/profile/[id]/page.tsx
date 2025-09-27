'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Profile {
  id: string;
  name: string;
  email: string;
  skills: string[];
  bio: string;
  available_for: string[];
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const params = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchProfile(params.id as string);
    }
  }, [params.id]);

  const fetchProfile = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:8000/profiles/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else if (response.status === 404) {
        setError('Profile not found');
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error || 'Profile not found'}</p>
          <Link
            href="/"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Profiles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <Link href="/" className="text-blue-600 hover:text-blue-700">
              ← Back to Profiles
            </Link>
            <Link
              href={`/request/${profile.id}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Connect with {profile.name}
            </Link>
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Profile Header */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.name}</h1>
            <p className="text-gray-600 mb-4">{profile.email}</p>
            <p className="text-sm text-gray-500">
              Member since {formatDate(profile.created_at)}
            </p>
          </div>

          {/* Bio */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
            <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
          </div>

          {/* Skills */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills & Expertise</h2>
            <div className="flex flex-wrap gap-3">
              {profile.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Available Services */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Available for</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {profile.available_for.map((service, index) => (
                <div
                  key={index}
                  className="bg-green-50 border border-green-200 rounded-lg p-4 text-center"
                >
                  <div className="text-green-600 font-medium capitalize text-lg">
                    {service}
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    {service === 'appointments' && 'Schedule one-on-one sessions'}
                    {service === 'quotes' && 'Request project estimates'}
                    {service === 'meetings' && 'Book consultation calls'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ready to connect with {profile.name}?
            </h3>
            <p className="text-gray-600 mb-4">
              Send a request to start a conversation and schedule your preferred type of connection.
            </p>
            <Link
              href={`/request/${profile.id}`}
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Send Connection Request
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}