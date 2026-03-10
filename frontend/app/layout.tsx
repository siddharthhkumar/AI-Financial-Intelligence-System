import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kite AI — Stock Intelligence Platform',
  description: 'Professional AI-powered stock analytics & predictions',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}