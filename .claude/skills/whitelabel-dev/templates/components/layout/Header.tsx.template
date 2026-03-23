// @template Header
// @version 4.0.0 (synced from template)
// @description Template for layout/Header.tsx

import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

export interface HeaderProps {
  mode?: 'default' | 'results';
  resultsData?: {
    count?: number;
    origin?: string;
    destination?: string;
    dates?: string;
  };
  className?: string;
}

const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({ mode = 'default', resultsData, className }, ref) => {
    const { pathname } = useLocation();

    const NotificationsIcon = () => (
      <span className="material-symbols-outlined">notifications</span>
    );
    const AccountIcon = () => (
      <span className="material-symbols-outlined">account_circle</span>
    );
    const BackIcon = () => (
      <span className="material-symbols-outlined">arrow_back</span>
    );
    const EditIcon = () => (
      <span className="material-symbols-outlined">edit</span>
    );

    const bottomNavItems = [
      {
        icon: 'home',
        label: 'Home',
        href: '/',
        active: pathname === '/',
        filled: true,
      },
      {
        icon: 'airplane_ticket',
        label: 'Bookings',
        href: '/bookings',
        active: pathname === '/bookings',
      },
      {
        icon: 'search',
        label: 'Search',
        href: '/search',
        style: 'fab',
        highlight: true,
        active: pathname === '/search',
      },
      {
        icon: 'explore',
        label: 'Explore',
        href: '/explore',
        active: pathname === '/explore',
      },
      {
        icon: 'person',
        label: 'Profile',
        href: '/profile',
        active: pathname === '/profile',
      },
    ];

    return (
      <>
        {/* Main Header */}
        <header
          ref={ref}
          className={cn(
            'fixed top-0 left-0 right-0 z-50 h-14 bg-white/95 backdrop-blur-md border-b border-gray-200',
            className
          )}
        >
          <div className="container mx-auto h-full px-4">
            {mode === 'default' ? (
              /* Default Header */
              <div className="flex items-center justify-between h-full">
                {/* Brand */}
                <Link to="/" className="flex items-center gap-2">
                  <img
                    src="/images/logo-placeholder.svg"
                    alt="SkyDemo"
                    className="h-8"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling;
                      if (fallback) {
                        (fallback as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
                  <div className="hidden items-center gap-1" style={{ display: 'none' }}>
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
                      HS
                    </div>
                    <div className="flex flex-col">
                      <span className="text-base font-semibold text-gray-900 leading-none">
                        SkyDemo
                      </span>
                      <span className="text-xs text-gray-500 leading-none mt-0.5">
                        Travel Agency
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-10 h-10 p-0 rounded-full"
                    aria-label="Notifications"
                  >
                    <NotificationsIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-10 h-10 p-0 rounded-full"
                    aria-label="Profile"
                  >
                    <AccountIcon />
                  </Button>
                </div>
              </div>
            ) : (
              /* Results Header */
              <div className="flex items-center justify-between h-full">
                {/* Back Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-10 h-10 p-0 rounded-full -ml-2"
                  onClick={() => window.history.back()}
                  aria-label="Go back"
                >
                  <BackIcon />
                </Button>

                {/* Search Info */}
                <div className="flex-1 px-2 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {resultsData?.count !== undefined
                      ? `${resultsData.count} Flights`
                      : 'Flight Search Results'}
                  </div>
                  {resultsData && (
                    <div className="text-xs text-gray-500 truncate">
                      {resultsData.origin && resultsData.destination
                        ? `${resultsData.origin} → ${resultsData.destination}`
                        : ''}
                      {resultsData.dates ? ` • ${resultsData.dates}` : ''}
                    </div>
                  )}
                </div>

                {/* Edit Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-10 h-10 p-0 rounded-full"
                  aria-label="Modify Search"
                >
                  <EditIcon />
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Spacer for fixed header */}
        <div className="h-14" />

        {/* Bottom Navigation (Mobile) */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
          aria-label="Bottom navigation"
        >
          <div className="mx-4 mb-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-around px-2 py-2">
              {bottomNavItems.map((item) => {
                if (item.style === 'fab') {
                  // FAB (Floating Action Button) style
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        'flex flex-col items-center justify-center relative',
                        'transition-transform active:scale-95'
                      )}
                    >
                      <div
                        className={cn(
                          'w-14 h-14 -mt-8 rounded-full',
                          'flex items-center justify-center',
                          'bg-gradient-to-br from-primary to-green-500',
                          'text-white shadow-lg'
                        )}
                      >
                        <span className="material-symbols-outlined text-2xl">
                          {item.icon}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-primary mt-1">
                        {item.label}
                      </span>
                    </Link>
                  );
                }

                // Regular nav items
                const isActive = item.active;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl',
                      'transition-all duration-200',
                      isActive
                        ? 'text-primary'
                        : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <span
                      className={cn(
                        'material-symbols-outlined text-2xl',
                        item.filled && isActive && 'font-bold'
                      )}
                    >
                      {item.icon}
                    </span>
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </>
    );
  }
);

Header.displayName = 'Header';

export { Header };
