import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'iFidget — A little less restless.',
  description:
    'Your pocket playground. Twelve satisfying fidgets with touch, sound, and motion. Pick one. Zone out.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'iFidget',
  },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#101112',
  viewportFit: 'cover',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
