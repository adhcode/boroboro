import type { Metadata } from 'next';

import { AuthProvider } from '@/contexts/AuthContext';
import { ActivityTracker } from '@/components/auth/ActivityTracker';
import { DesktopNav } from '@/components/layout/DesktopNav';
import './globals.css';

export const metadata: Metadata = {
  title: 'Boroboro - Rent Anything, Anytime',
  description: 'Peer-to-peer rental marketplace for equipment, tools, and more',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Valley+Sans:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-valley">
        <AuthProvider>
          <ActivityTracker />
          <DesktopNav />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
