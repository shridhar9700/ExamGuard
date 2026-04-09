import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ExamGuard - The Next Generation of Secure Assessments',
  description: 'Enterprise-grade secure assessment and proctored examination platform with active visual monitoring, audio telemetry, and anti-cheat enforcement.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
