'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Home,
  MessageSquare,
  Send,
  User,
  HelpCircle,
  LogOut,
  Settings
} from 'lucide-react';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { signOut } from '@workos-inc/authkit-nextjs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Menu items
const menuItems = [
  {
    title: 'Home',
    url: '/home',
    icon: Home,
  },
  {
    title: 'Meeting Requests',
    url: '/meeting-requests',
    icon: MessageSquare,
  },
  {
    title: 'Sent Requests',
    url: '/sent-requests',
    icon: Send,
  },
  {
    title: 'Calendar',
    url: '/calendar',
    icon: Calendar,
  },
];

const secondaryItems = [
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
  },
  {
    title: 'Support',
    url: '/support',
    icon: HelpCircle,
  },
];

export function AppSidebar() {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="fixed left-0 top-0 h-screen w-16 bg-white border-r border-gray-200 flex flex-col items-center z-50">
        {/* Logo at top */}
        <Link href="/home" className="flex items-center justify-center h-16 w-full border-b border-gray-200">
          <div className="text-2xl font-bold text-orange-600">P</div>
        </Link>

        {/* Main navigation - vertically centered */}
        <div className="flex-1 flex flex-col items-center justify-center gap-1 py-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.url || pathname?.startsWith(item.url + '/');
            return (
              <Tooltip key={item.title}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.url}
                    className={`
                      flex items-center justify-center
                      h-12 w-12 rounded-lg
                      transition-colors
                      ${isActive
                        ? 'bg-orange-100 text-orange-600'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <item.icon className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.title}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Secondary items at bottom */}
        <div className="flex flex-col items-center gap-1 pb-4">
          {secondaryItems.map((item) => {
            const isActive = pathname === item.url;
            return (
              <Tooltip key={item.title}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.url}
                    className={`
                      flex items-center justify-center
                      h-12 w-12 rounded-lg
                      transition-colors
                      ${isActive
                        ? 'bg-orange-100 text-orange-600'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <item.icon className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.title}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* User menu at bottom */}
        <div className="border-t border-gray-200 w-full flex items-center justify-center py-3">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-center h-10 w-10 rounded-lg hover:bg-gray-100 transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-orange-600 text-white text-sm font-semibold">
                        {authLoading ? '...' : (user?.firstName ? getUserInitials(user.firstName + ' ' + (user.lastName || '')) : 'U')}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                {authLoading ? 'Loading...' : `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent
              className="w-56 rounded-lg"
              side="right"
              align="end"
              sideOffset={8}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-3 px-3 py-2 text-left text-sm">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-orange-600 text-white font-semibold">
                      {authLoading ? '...' : (user?.firstName ? getUserInitials(user.firstName + ' ' + (user.lastName || '')) : 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-semibold text-gray-900">
                      {authLoading ? 'Loading...' : `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
                    </span>
                    <span className="truncate text-xs text-gray-500">
                      {authLoading ? 'Loading...' : (user?.email || 'user@example.com')}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/support" className="cursor-pointer">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Support
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  );
}