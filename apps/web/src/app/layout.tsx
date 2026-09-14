import type { Metadata } from 'next';

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
      <body className="font-valley">{children}</body>
    </html>
  );
}
