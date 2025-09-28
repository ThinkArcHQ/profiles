'use client';

import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { OnboardingFlow, useOnboarding } from './onboarding-flow';

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

export function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const { user, loading } = useAuth();
  const { showOnboarding, completeOnboarding, skipOnboarding } = useOnboarding();

  // Only show onboarding for authenticated users
  const shouldShowOnboarding = !loading && user && showOnboarding;

  return (
    <>
      {children}
      {shouldShowOnboarding && (
        <OnboardingFlow
          onComplete={completeOnboarding}
          onSkip={skipOnboarding}
        />
      )}
    </>
  );
}