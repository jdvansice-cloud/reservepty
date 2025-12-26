import type { Metadata, Viewport } from 'next';
import { Playfair_Display, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from './providers';

// Display font - elegant serif for headings
const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
});

// Body font - modern sans-serif
const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
});

// Monospace font - for data and code
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
});

export const metadata: Metadata = {
  title: {
    default: 'ReservePTY | Luxury Asset Management',
    template: '%s | ReservePTY',
  },
  description:
    'Premium platform for managing luxury assets. Coordinate bookings for private planes, helicopters, residences, and boats.',
  keywords: [
    'luxury assets',
    'private aviation',
    'yacht management',
    'property booking',
    'family office',
    'asset management',
  ],
  authors: [{ name: 'ReservePTY' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://reservepty.com',
    title: 'ReservePTY | Luxury Asset Management',
    description:
      'Premium platform for managing luxury assets. Coordinate bookings for private planes, helicopters, residences, and boats.',
    siteName: 'ReservePTY',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ReservePTY | Luxury Asset Management',
    description:
      'Premium platform for managing luxury assets.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#0a1628',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${dmSans.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased noise">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
