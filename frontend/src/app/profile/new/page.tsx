'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';

export default function NewProfile() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    display_name: '',
    email: '',
    profession: '',
    headline: '',
    location: '',
    skills: '',
    profile_picture: null as File | null,
    available_for: ['meetings'] as string[],
    profile_visibility: 'public' as 'public' | 'members_only' | 'connections_only'
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, profile_picture: file }));
  };
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pre-fill form with user data if authenticated
    if (user) {
      setFormData(prev => ({
        ...prev,
        display_name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
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
          name: formData.display_name,
          email: formData.email,
          bio: formData.headline, // Using headline as bio for now
          skills: skillsArray.slice(0, 5), // Limit to 5 skills
          available_for: formData.available_for,
          location: formData.location,
          profile_visibility: formData.profile_visibility
        }),
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        alert('Failed to create profile');
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      alert('Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityChange = (value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      available_for: checked 
        ? [...prev.available_for, value]
        : prev.available_for.filter(item => item !== value)
    }));
  };

  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = (currentStep / 2) * 100;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-orange-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Create Your Profile</h1>
          <p className="text-orange-600">Minimal data, maximum privacy - get discovered by AI agents</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-orange-600 mb-2">
            <span>Step {currentStep} of 2</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="shadow-lg border-orange-500">
          <CardHeader className="border-b border-orange-500">
            <CardTitle className="text-xl text-black">
              {currentStep === 1 && "Identity & Location"}
              {currentStep === 2 && "Expertise & Availability"}
            </CardTitle>
            <CardDescription className="text-orange-600">
              {currentStep === 1 && "How should AI agents identify and locate you?"}
              {currentStep === 2 && "What skills do you offer and how can people connect?"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Identity & Location */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="display_name" className="text-black">Display Name *</Label>
                    <Input
                      id="display_name"
                      type="text"
                      value={formData.display_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                      placeholder="Your professional name or pseudonym"
                      required
                    />
                    <p className="text-sm text-orange-600 mt-1">
                      Can be your real name, professional name, or pseudonym
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="profession" className="text-black">Profession</Label>
                    <Input
                      id="profession"
                      type="text"
                      value={formData.profession}
                      onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))}
                      placeholder="e.g., Software Engineer, Designer, Teacher"
                    />
                    <p className="text-sm text-orange-600 mt-1">
                      Optional - helps AI agents understand your role
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="profile_picture" className="text-black">Profile Picture</Label>
                    <div className="mt-1">
                      <input
                        id="profile_picture"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-black file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100 border border-orange-500 rounded-md p-2"
                      />
                      <p className="text-sm text-orange-600 mt-1">
                        Optional - JPG, PNG, or GIF (max 5MB)
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="headline" className="text-black">Professional Headline *</Label>
                    <Textarea
                      id="headline"
                      value={formData.headline}
                      onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
                      placeholder="Brief description of what you do (1-2 lines)"
                      rows={2}
                      required
                    />
                    <p className="text-sm text-orange-600 mt-1">
                      Keep it concise - this helps AI agents understand your expertise
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="location" className="text-black">General Location *</Label>
                    <Input
                      id="location"
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="City, Region (e.g., San Francisco, CA)"
                      required
                    />
                    <p className="text-sm text-orange-600 mt-1">
                      City/region only - no specific addresses needed
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Expertise & Availability */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="skills" className="text-black">Top Skills & Expertise *</Label>
                    <Input
                      id="skills"
                      type="text"
                      value={formData.skills}
                      onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                      placeholder="e.g., Python, Design, Marketing, Cooking, Teaching"
                      required
                    />
                    <p className="text-sm text-orange-600 mt-1">
                      List your top 3-5 skills (comma-separated) - quality over quantity
                    </p>
                  </div>

                  <div>
                    <Label className="text-base font-semibold text-black">How can people connect with you? *</Label>
                    <p className="text-sm text-orange-600 mb-4">
                      Select the types of connections you&apos;re open to receiving
                    </p>
                    
                    <div className="space-y-3">
                      {[
                        { value: 'meetings', label: 'Meeting Requests', desc: 'General conversations, consultations, networking' },
                        { value: 'quotes', label: 'Quote Requests', desc: 'Paid work, consulting, project estimates' }
                      ].map((option) => (
                        <div key={option.value} className="flex items-start space-x-3 p-3 border border-orange-500 rounded-lg hover:bg-orange-50 transition-colors">
                          <Checkbox
                            id={option.value}
                            checked={formData.available_for.includes(option.value)}
                            onCheckedChange={(checked) => 
                              handleAvailabilityChange(option.value, checked as boolean)
                            }
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <Label htmlFor={option.value} className="text-sm font-medium cursor-pointer text-black">
                              {option.label}
                            </Label>
                            <p className="text-xs text-orange-600 mt-1">{option.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Privacy & Contact */}
              {/* Removed - no longer needed since we don't share emails and have terms/privacy policy */}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <div>
                  {currentStep > 1 && (
                    <Button type="button" variant="outline" onClick={prevStep}>
                      Previous
                    </Button>
                  )}
                </div>

                <div className="flex space-x-3">
                  {currentStep < 2 ? (
                    <Button 
                      type="button" 
                      onClick={nextStep}
                      disabled={
                        (currentStep === 1 && (!formData.display_name || !formData.headline || !formData.location))
                      }
                    >
                      Next Step
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      disabled={loading || !formData.skills || formData.available_for.length === 0}
                    >
                      {loading ? 'Creating Profile...' : 'Create Profile'}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}