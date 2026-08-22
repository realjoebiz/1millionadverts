import type { Metadata } from 'next';
import { Space_Grotesk, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: '1 Million Adverts — Own a piece of the internet',
  description:
    'Buy pixel space on a public 1,000,000-pixel billboard. Link your site, get seen, flex forever.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-[#0b0f14] font-[family-name:var(--font-display)] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
