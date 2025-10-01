'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@workos-inc/authkit-nextjs/components';


import { AppSidebar } from '@/components/app-sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}



export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  
  // Don't render sidebar for auth pages
  const authPages = ['/login', '/logout', '/profile/new'];
  const isExactHomePage = pathname === '/';
  
  // Exclude profiles pages from dashboard layout (they have their own full-screen layout)
  const isProfilesPage = pathname.startsWith('/profiles');

  // Check if this is a root-level profile page (individual profile slug)
  // Root-level profile pages are paths that don't start with known dashboard routes
  const knownRoutes = ['/calendar', '/settings', '/requests',
                      '/home', '/profile', '/api'];
  const isRootLevelProfilePage = !knownRoutes.some(route => pathname.startsWith(route)) &&
                                pathname !== '/' &&
                                !authPages.some(page => pathname.startsWith(page));

  // Show sidebar for dashboard routes when user is authenticated or while loading
  const isDashboardRoute = pathname.startsWith('/calendar') ||
                          pathname.startsWith('/settings') ||
                          pathname.startsWith('/requests');
  const shouldShowSidebar = isDashboardRoute && !authPages.some(page => pathname.startsWith(page)) && !isExactHomePage && !isProfilesPage && !isRootLevelProfilePage;

  // Debug logging
  console.log('DashboardLayout - pathname:', pathname);
  console.log('DashboardLayout - user:', user);
  console.log('DashboardLayout - authLoading:', authLoading);
  console.log('DashboardLayout - isDashboardRoute:', isDashboardRoute);
  console.log('DashboardLayout - shouldShowSidebar:', shouldShowSidebar);

  if (shouldShowSidebar) {

    return (
      <>
        <AppSidebar />
        {children}
      </>
    );
  }

  // Default case - no sidebar for other pages
  return <>{children}</>;
}