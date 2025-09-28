'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Profile {
  id: string;
  slug?: string;
  name: string;
  email: string;
  skills: string[];
  bio: string;
  availableFor: string[];
  created_at: string;
  updated_at: string;
}

export default function RequestPage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    requester_name: '',
    requester_email: '',
    message: '',
    preferred_time: '',
    request_type: ''
  });

  useEffect(() => {
    if (params.id) {
      fetchProfile(params.id as string);
    }
  }, [params.id]);

  const fetchProfile = async (id: string) => {
    try {
      const response = await fetch(`/api/profiles/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        // Set default request type if only one option is available
        if (data.availableFor.length === 1) {
          setFormData(prev => ({ ...prev, request_type: data.availableFor[0] }));
        }
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile_id: params.id,
          requester_name: formData.requester_name,
          requester_email: formData.requester_email,
          message: formData.message,
          preferred_time: formData.preferred_time || null,
          request_type: formData.request_type
        }),
      });

      if (response.ok) {
        alert('Request sent successfully! You should hear back soon.');
        router.push('/');
      } else {
        throw new Error('Failed to send request');
      }
    } catch (error) {
      console.error('Error sending request:', error);
      alert('Failed to send request. Please try again.');
    } finally {
      setSubmitting(false);
    }
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">Profile not found</p>
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

  const getRequestTypeDescription = (type: string) => {
    switch (type) {
      case 'appointments':
        return 'Schedule a one-on-one session';
      case 'meeting':
      case 'meetings':
        return 'Book a consultation or meeting';
      case 'quote':
      case 'quotes':
        return 'Request a project estimate or quote';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href={profile.slug ? `/profiles/${profile.slug}` : `/profile/${profile.id}`} className="text-blue-600 hover:text-blue-700 mr-4">
              ← Back to Profile
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Connect with {profile.name}
            </h1>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{profile.name}</h2>
              <p className="text-gray-600 mt-1">{profile.email}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {profile.skills.slice(0, 3).map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {skill}
                  </span>
                ))}
                {profile.skills.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                    +{profile.skills.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Request Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="request_type" className="block text-sm font-medium text-gray-700 mb-2">
                Request Type *
              </label>
              <select
                id="request_type"
                required
                value={formData.request_type}
                onChange={(e) => setFormData({ ...formData, request_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a request type</option>
                {profile.availableFor.map((service) => (
                  <option key={service} value={service}>
                    {service.charAt(0).toUpperCase() + service.slice(1)} - {getRequestTypeDescription(service)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="requester_name" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name *
              </label>
              <input
                type="text"
                id="requester_name"
                required
                value={formData.requester_name}
                onChange={(e) => setFormData({ ...formData, requester_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label htmlFor="requester_email" className="block text-sm font-medium text-gray-700 mb-2">
                Your Email *
              </label>
              <input
                type="email"
                id="requester_email"
                required
                value={formData.requester_email}
                onChange={(e) => setFormData({ ...formData, requester_email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label htmlFor="preferred_time" className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Time (Optional)
              </label>
              <input
                type="text"
                id="preferred_time"
                value={formData.preferred_time}
                onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Next week, Monday 2-4 PM, ASAP"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                id="message"
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe what you're looking for, your project details, or any specific requirements..."
              />
            </div>

            <div className="flex gap-4 pt-6">
              <Link
                href={profile.slug ? `/profiles/${profile.slug}` : `/profile/${profile.id}`}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-center hover:bg-gray-200 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}