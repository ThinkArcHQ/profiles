'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { authManager } from '@/lib/auth';

export default function NewProfile() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    skills: '',
    available_for: [] as string[]
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pre-fill form with user data if authenticated
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name,
        email: user.email
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const skillsArray = formData.skills.split(',').map(skill => skill.trim()).filter(Boolean);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add auth headers if user is logged in
      if (user) {
        Object.assign(headers, authManager.getAuthHeaders());
      }
      
      const response = await fetch('http://localhost:8000/profiles', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          bio: formData.bio,
          skills: skillsArray,
          available_for: formData.available_for
        }),
      });

      if (response.ok) {
        if (user) {
          router.push('/dashboard');
        } else {
          router.push('/');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create profile');
      }
    } catch (error: any) {
      console.error('Error creating profile:', error);
      if (error.message.includes('Authentication required')) {
        alert('Please sign in to create a profile.');
        router.push('/login');
      } else {
        alert(error.message || 'Failed to create profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityChange = (service: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      available_for: checked
        ? [...prev.available_for, service]
        : prev.available_for.filter(s => s !== service)
    }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">FB</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Profiles by FinderBee</h1>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href={user ? "/dashboard" : "/"}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                {user ? "Dashboard" : "Home"}
              </Link>
              {!user && (
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Create Your Profile</h2>
          <p className="mt-2 text-gray-600">
            {user 
              ? "Share your expertise with the AI-powered community"
              : "Join our AI-powered networking platform"
            }
          </p>
          {!user && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700">
                💡 <Link href="/login" className="underline font-medium">Sign in</Link> to manage your profiles and receive appointment requests in your dashboard.
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="Enter your full name"
                disabled={user ? true : false}
              />
              {user && (
                <p className="mt-1 text-sm text-gray-500">Name is automatically filled from your account</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="Enter your email address"
                disabled={user ? true : false}
              />
              {user && (
                <p className="mt-1 text-sm text-gray-500">Email is automatically filled from your account</p>
              )}
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                Professional Bio *
              </label>
              <textarea
                id="bio"
                required
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="Describe your expertise, experience, and what makes you unique..."
              />
            </div>

            <div>
              <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">
                Skills & Expertise *
              </label>
              <input
                type="text"
                id="skills"
                required
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="e.g., Python, AI, Machine Learning, Consulting (separate with commas)"
              />
              <p className="mt-1 text-sm text-gray-500">Separate multiple skills with commas</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Available Services *
              </label>
              <div className="space-y-3">
                {[
                  { value: 'appointments', label: 'Appointments', desc: 'One-on-one consultations and meetings' },
                  { value: 'quotes', label: 'Quotes', desc: 'Project estimates and pricing consultations' },
                  { value: 'meetings', label: 'Meetings', desc: 'Group discussions and collaborations' }
                ].map((service) => (
                  <div key={service.value} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id={service.value}
                      checked={formData.available_for.includes(service.value)}
                      onChange={(e) => handleAvailabilityChange(service.value, e.target.checked)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <label htmlFor={service.value} className="text-sm font-medium text-gray-900 cursor-pointer">
                        {service.label}
                      </label>
                      <p className="text-sm text-gray-500">{service.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              {formData.available_for.length === 0 && (
                <p className="mt-2 text-sm text-red-600">Please select at least one service</p>
              )}
            </div>

            <div className="flex space-x-4 pt-6">
              <Link
                href={user ? "/dashboard" : "/"}
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg text-center hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || formData.available_for.length === 0}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Creating Profile...' : 'Create Profile'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}