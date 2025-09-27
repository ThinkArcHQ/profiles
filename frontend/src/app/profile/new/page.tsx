'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@workos-inc/authkit-nextjs/components';

export default function NewProfile() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    skills: '',
    available_for: ['meetings'] as string[]
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pre-fill form with user data if authenticated
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
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
    } catch (error: unknown) {
      console.error('Error creating profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create profile. Please try again.';
      if (errorMessage.includes('Authentication required')) {
        alert('Please sign in to create a profile.');
        router.push('/login');
      } else {
        alert(errorMessage);
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
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-orange-500 text-white flex size-6 items-center justify-center rounded-md">
              <span className="text-xs font-bold">P</span>
            </div>
            Profiles
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Create Your Profile</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  {user 
                    ? "Set up your profile to be discovered by AI agents worldwide"
                    : "Join our community and become discoverable by AI agents"
                  }
                </p>
                {!user && (
                  <p className="text-xs text-gray-500 mt-2">
                    💡 <Link href="/login" className="text-orange-600 hover:text-orange-700 underline font-medium transition-colors">Sign in</Link> to manage your profiles
                  </p>
                )}
              </div>

              {/* Step Indicator */}
              <div className="flex justify-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${currentStep === 1 ? 'bg-orange-100 text-orange-700' : currentStep > 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  <span className="w-4 h-4 rounded-full bg-current text-white flex items-center justify-center text-[10px] font-bold">1</span>
                  <span className="font-medium">Basic</span>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${currentStep === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                  <span className="w-4 h-4 rounded-full bg-current text-white flex items-center justify-center text-[10px] font-bold">2</span>
                  <span className="font-medium">Details</span>
                </div>
              </div>

              <div className="grid gap-6">
                {currentStep === 1 && (
                  <>
                    <div className="grid gap-3">
                      <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="What should people call you?"
                        disabled={user ? true : false}
                      />
                      {user && (
                        <p className="text-xs text-orange-600">✨ Name is automatically filled from your account</p>
                      )}
                    </div>

                    <div className="grid gap-3">
                      <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="m@example.com"
                        disabled={user ? true : false}
                      />
                      {user && (
                        <p className="text-xs text-orange-600">✨ Email is automatically filled from your account</p>
                      )}
                    </div>

                    <div className="grid gap-3">
                      <label htmlFor="bio" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Tell Your Story *
                      </label>
                      <textarea
                        id="bio"
                        required
                        rows={4}
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                        placeholder="Share who you are, what you do, your interests, hobbies, or anything that makes you unique..."
                      />
                      <p className="text-xs text-muted-foreground">💡 Be yourself! AI agents are interested in all kinds of people.</p>
                    </div>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    <div className="grid gap-3">
                      <label htmlFor="skills" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Your Talents & Interests *
                      </label>
                      <input
                        type="text"
                        id="skills"
                        required
                        value={formData.skills}
                        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Photography, Cooking, Teaching, Writing, Gaming, Art..."
                      />
                      <p className="text-xs text-muted-foreground">✨ Include anything you&apos;re good at or passionate about - separate with commas</p>
                    </div>

                    <div className="grid gap-3">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        How Would You Like to Connect? *
                      </label>
                      <div className="space-y-3">
                        {[
                          { value: 'meetings', label: 'Meetings', desc: 'General conversations, discussions, and connections' },
                          { value: 'quotes', label: 'Services', desc: 'Professional work, consulting, or paid projects' }
                        ].map((service) => (
                          <div key={service.value} className="flex items-start space-x-3 p-3 border border-input rounded-md hover:border-orange-300 transition-colors">
                            <input
                              type="checkbox"
                              id={service.value}
                              checked={formData.available_for.includes(service.value)}
                              onChange={(e) => handleAvailabilityChange(service.value, e.target.checked)}
                              className="mt-1 h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                              <label htmlFor={service.value} className="text-sm font-medium cursor-pointer">
                                {service.label}
                              </label>
                              <p className="text-xs text-muted-foreground mt-1">{service.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {formData.available_for.length === 0 && (
                        <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded-md border border-orange-200">Please select at least one way you&apos;d like to connect</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-between pt-6">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(currentStep - 1)}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                    >
                      Back
                    </button>
                  )}
                  
                  {currentStep < 2 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(currentStep + 1)}
                      disabled={!formData.name || !formData.email || !formData.bio}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ml-auto"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading || formData.available_for.length === 0}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ml-auto"
                    >
                      {loading ? 'Creating Profile...' : 'Complete Profile'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

          {/* Right side - Image/Brand */}
          <div className="hidden lg:block relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-orange-800">
              <div className="flex items-center justify-center h-full p-8">
                <div className="max-w-md text-center text-white">
                  <h2 className="text-3xl font-bold mb-6">Join the Future of Connection</h2>
                  <p className="text-lg text-orange-100 mb-8">
                    AI agents are looking for real people with unique perspectives and talents.
                  </p>
                  <div className="space-y-4 text-left">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-orange-200 rounded-full"></div>
                      <span className="text-orange-100">Connect with intelligent AI agents</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-orange-200 rounded-full"></div>
                      <span className="text-orange-100">Share your unique talents and interests</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-orange-200 rounded-full"></div>
                      <span className="text-orange-100">Build meaningful connections</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

  );
}