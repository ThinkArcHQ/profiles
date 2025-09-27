'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewProfile() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    skills: '',
    available_for: [] as string[]
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const skillsArray = formData.skills.split(',').map(skill => skill.trim()).filter(Boolean);
      
      const response = await fetch('http://localhost:8000/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          bio: formData.bio,
          skills: skillsArray,
          available_for: formData.available_for
        }),
      });

      if (response.ok) {
        router.push('/');
      } else {
        throw new Error('Failed to create profile');
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      alert('Failed to create profile. Please try again.');
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href="/" className="text-blue-600 hover:text-blue-700 mr-4">
              ← Back to Profiles
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Create New Profile</h1>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                Bio *
              </label>
              <textarea
                id="bio"
                required
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tell us about yourself, your expertise, and what you do..."
              />
            </div>

            <div>
              <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">
                Skills *
              </label>
              <input
                type="text"
                id="skills"
                required
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="JavaScript, Python, AI, Machine Learning (comma-separated)"
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter your skills separated by commas
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available for *
              </label>
              <div className="space-y-2">
                {['appointments', 'quotes', 'meetings'].map((service) => (
                  <label key={service} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.available_for.includes(service)}
                      onChange={(e) => handleAvailabilityChange(service, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">{service}</span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Select what types of connections you're open to
              </p>
            </div>

            <div className="flex gap-4 pt-6">
              <Link
                href="/"
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-center hover:bg-gray-200 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || formData.available_for.length === 0}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Profile'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}