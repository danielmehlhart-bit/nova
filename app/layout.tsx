import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'NOVA · After Work',
  description:
    'The year is 2186. Everything is abundant. Shape a city for life after work. A voice-first city simulator about freedom, community and possibility.',
  icons: { icon: '/icon.svg' },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
