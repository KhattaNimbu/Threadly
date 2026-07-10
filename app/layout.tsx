import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import ThemeProvider from '@/components/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Threadly — AI Meeting Intelligence',
    template: '%s | Threadly',
  },
  description:
    'Turn raw meeting transcripts into structured summaries, auto-assigned action items, and cross-meeting pattern insights powered by AI.',
  keywords: ['meeting notes', 'AI meeting summary', 'action items', 'meeting intelligence'],
  openGraph: {
    title: 'Threadly — AI Meeting Intelligence',
    description: 'AI-powered meeting intelligence tool',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          {/* eslint-disable-next-line @next/next/no-page-custom-font */}
          <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        </head>
        <body>
          <ThemeProvider>{children}</ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
