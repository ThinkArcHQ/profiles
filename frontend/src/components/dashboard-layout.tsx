'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@workos-inc/authkit-nextjs/components';

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

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const getBreadcrumbs = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [{ title: 'Home', href: '/profiles' }];
  
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
  const knownRoutes = ['/calendar', '/settings', '/support', '/meeting-requests', 
                      '/sent-requests', '/home', '/profile', '/api'];
  const isRootLevelProfilePage = !knownRoutes.some(route => pathname.startsWith(route)) && 
                                pathname !== '/' && 
                                !authPages.some(page => pathname.startsWith(page));
  
  // Show sidebar for dashboard routes when user is authenticated or while loading
  const isDashboardRoute = pathname.startsWith('/calendar') || 
                          pathname.startsWith('/settings') || pathname.startsWith('/support') ||
                          pathname.startsWith('/meeting-requests') ||
                          pathname.startsWith('/sent-requests');
  const shouldShowSidebar = isDashboardRoute && !authPages.some(page => pathname.startsWith(page)) && !isExactHomePage && !isProfilesPage && !isRootLevelProfilePage;

  // Debug logging
  console.log('DashboardLayout - pathname:', pathname);
  console.log('DashboardLayout - user:', user);
  console.log('DashboardLayout - authLoading:', authLoading);
  console.log('DashboardLayout - isDashboardRoute:', isDashboardRoute);
  console.log('DashboardLayout - shouldShowSidebar:', shouldShowSidebar);

  if (shouldShowSidebar) {
    const breadcrumbs = getBreadcrumbs(pathname);

    return (
      <SidebarProvider defaultOpen={false}>
        <AppSidebar className="border-r" />
        <SidebarInset className="min-h-screen flex-1">
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((breadcrumb, index) => (
                    <React.Fragment key={`${breadcrumb.href}-${index}`}>
                      {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                      <BreadcrumbItem className="hidden md:block">
                        {index === breadcrumbs.length - 1 ? (
                          <BreadcrumbPage>{breadcrumb.title}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={breadcrumb.href}>
                            {breadcrumb.title}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Default case - no sidebar for other pages
  return <>{children}</>;
}