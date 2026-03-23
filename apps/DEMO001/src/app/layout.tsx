/**
 * @description Root layout component for DEMO001 tenant app.
 *              Renders the layout with Header, main content, and Footer.
 */
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header - will be added by component-builder */}
      <main className="flex-1">{children}</main>
      {/* Footer - will be added by component-builder */}
    </div>
  );
}
