// @template Layout
// @version 4.0.0 (synced from template)
// @description Template for layout/Layout.tsx

import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { cn } from '@/lib/utils';

export interface LayoutProps {
  children: React.ReactNode;
  headerMode?: 'default' | 'results';
  headerResultsData?: {
    count?: number;
    origin?: string;
    destination?: string;
    dates?: string;
  };
  showFooter?: boolean;
  className?: string;
}

export default function Layout({
  children,
  headerMode = 'default',
  headerResultsData,
  showFooter = true,
  className,
}: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header mode={headerMode} resultsData={headerResultsData} />
      <main className={cn('flex-1', className)}>{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}
