'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import Link from 'next/link';
import { User } from 'lucide-react';

import { AppSidebar } from '@/components/app-sidebar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const getBreadcrumbs = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: { title: string; href: string }[] = [];

  // Handle different route patterns
  if (segments[0] === 'profiles' && segments[1]) {
    // For /profiles/[slug] routes
    breadcrumbs.push({ title: 'Profiles', href: '/profiles' });
    breadcrumbs.push({ title: segments[1], href: pathname });
  } else {
    // Handle other routes
    segments.forEach((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/');
      const title = segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbs.push({ title, href });
    });
  }

  return breadcrumbs;
};

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
    const breadcrumbs = getBreadcrumbs(pathname);
    const getUserInitials = (name: string) => {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    return (
      <SidebarProvider defaultOpen={false}>
        <AppSidebar className="border-r" />
        <SidebarInset className="min-h-screen flex-1 ml-16">
          <div className="flex flex-1 flex-col gap-4 p-4">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Default case - no sidebar for other pages
  return <>{children}</>;
}