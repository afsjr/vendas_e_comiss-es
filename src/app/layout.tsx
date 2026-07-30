import type { Metadata, Viewport } from 'next';
import GlobalAuth from '@/components/GlobalAuth';
import './globals.css';

export const metadata: Metadata = {
  title: 'Comissionamento e Vendas',
  description: 'Plataforma de gestão de vendas e comissionamento educacional',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Comissionamento' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="theme-color" content="#0f172a" />
        <script dangerouslySetInnerHTML={{ __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js'); }); }` }} />
      </head>
      <body className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
        <main className="min-h-screen flex flex-col">
          <GlobalAuth />
          <div className="flex-1">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
