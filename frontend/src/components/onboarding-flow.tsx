'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Globe, 
  Link, 
  Eye, 
  Users, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  X,
  Sparkles
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
  className?: string;
}

export function OnboardingFlow({ onComplete, onSkip, className = "" }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Profiles!',
      description: 'Your gateway to AI agent discovery',
      icon: <Sparkles className="h-6 w-6 text-purple-600" />,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Get Discovered by AI Agents Worldwide</h3>
            <p className="text-gray-600">
              Profiles is a universal platform where AI agents can discover and connect with you through 
              the Model Context Protocol (MCP). Let&apos;s set up your profile for maximum visibility and control.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Globe className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium text-blue-900">Global Discovery</h4>
              <p className="text-sm text-blue-700">Be found by AI agents worldwide</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium text-green-900">Privacy Control</h4>
              <p className="text-sm text-green-700">You control what AI agents see</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Link className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium text-purple-900">Clean URLs</h4>
              <p className="text-sm text-purple-700">Get a professional profile URL</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'privacy',
      title: 'Privacy Settings',
      description: 'Control who can see your profile',
      icon: <Shield className="h-6 w-6 text-green-600" />,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <Shield className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">You&apos;re in Complete Control</h3>
            <p className="text-gray-600">
              Your privacy is paramount. You decide exactly what information AI agents can access.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <Eye className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-900 mb-1">Public Profile</h4>
                <p className="text-sm text-green-700 mb-2">
                  Make your profile discoverable by AI agents worldwide. You can change this anytime.
                </p>
                <Badge variant="outline" className="text-green-700 border-green-300">
                  Recommended for AI discovery
                </Badge>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Globe className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Search Visibility</h4>
                <p className="text-sm text-blue-700 mb-2">
                  Allow your profile to appear in search results and AI agent queries.
                </p>
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  Increases discoverability
                </Badge>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <Users className="h-6 w-6 text-purple-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-purple-900 mb-1">Meeting Requests</h4>
                <p className="text-sm text-purple-700 mb-2">
                  Let AI agents and people request meetings with you directly.
                </p>
                <Badge variant="outline" className="text-purple-700 border-purple-300">
                  Enable connections
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-800 mb-1">Your Email is Always Private</h4>
                <p className="text-sm text-amber-700">
                  Your email address is never shared with AI agents or shown in search results, 
                  regardless of your privacy settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'profile-url',
      title: 'Your Profile URL',
      description: 'Get a clean, professional URL',
      icon: <Link className="h-6 w-6 text-blue-600" />,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <Link className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Professional Profile URLs</h3>
            <p className="text-gray-600">
              Get a clean, memorable URL that's perfect for sharing and AI agent discovery.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Automatic Slug Generation</h4>
              <p className="text-sm text-blue-700 mb-3">
                We&apos;ll automatically create a unique slug based on your name, like:
              </p>
              <div className="bg-white p-3 rounded border font-mono text-sm">
                profiles.finderbee.ai/profiles/<span className="text-blue-600">john-doe</span>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Easy to Share</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Add to your email signature</li>
                <li>• Share on social media</li>
                <li>• Include in business cards</li>
                <li>• Generate QR codes for easy access</li>
              </ul>
            </div>
            
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">AI Agent Discovery</h4>
              <p className="text-sm text-purple-700">
                AI agents worldwide can find you using this URL through the Model Context Protocol (MCP). 
                They can search by your name, skills, or expertise.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'ai-agents',
      title: 'AI Agent Integration',
      description: 'How AI agents discover you',
      icon: <Globe className="h-6 w-6 text-indigo-600" />,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Model Context Protocol (MCP)</h3>
            <p className="text-gray-600">
              Your profile is discoverable through MCP, the standard protocol for AI agent communication.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <h4 className="font-medium text-indigo-900 mb-2">How AI Agents Find You</h4>
              <ul className="text-sm text-indigo-700 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  Search by your name, skills, or expertise
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  Filter by availability (meetings, quotes, appointments)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  Access your public profile information
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  Request meetings directly through the platform
                </li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">What AI Agents Can See</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Your name and professional bio</li>
                <li>• Skills and areas of expertise</li>
                <li>• Availability preferences</li>
                <li>• LinkedIn and other professional links</li>
                <li>• Your clean profile URL</li>
              </ul>
            </div>
            
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-900 mb-2">What AI Agents Cannot See</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Your email address (always private)</li>
                <li>• Private profiles (if you choose private)</li>
                <li>• Any information you don't explicitly share</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${className}`}>
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {steps[currentStep].icon}
              <div>
                <CardTitle className="text-lg">{steps[currentStep].title}</CardTitle>
                <CardDescription>{steps[currentStep].description}</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onSkip}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          {/* Step indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => handleStepClick(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentStep 
                    ? 'bg-blue-600' 
                    : completedSteps.has(index)
                    ? 'bg-green-600'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to step ${index + 1}: ${step.title}`}
              />
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
          {steps[currentStep].content}
        </CardContent>
        
        <div className="border-t p-6">
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex gap-3">
              <Button variant="ghost" onClick={onSkip}>
                Skip Tour
              </Button>
              <Button onClick={handleNext}>
                {currentStep === steps.length - 1 ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Get Started
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Hook to manage onboarding state
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has seen onboarding
    const seen = localStorage.getItem('profiles-onboarding-seen');
    if (!seen) {
      setShowOnboarding(true);
    } else {
      setHasSeenOnboarding(true);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem('profiles-onboarding-seen', 'true');
    setShowOnboarding(false);
    setHasSeenOnboarding(true);
  };

  const skipOnboarding = () => {
    localStorage.setItem('profiles-onboarding-seen', 'true');
    setShowOnboarding(false);
    setHasSeenOnboarding(true);
  };

  const resetOnboarding = () => {
    localStorage.removeItem('profiles-onboarding-seen');
    setShowOnboarding(true);
    setHasSeenOnboarding(false);
  };

  return {
    showOnboarding,
    hasSeenOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding
  };
}