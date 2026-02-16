import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Polish Property Tracker – Ceny mieszkań',
  description: 'Śledzenie cen mieszkań od deweloperów i cen transakcyjnych w polskich miastach',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="min-h-screen">
        <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <a href="/" className="flex items-center gap-3 group">
                <span className="text-2xl">🏠</span>
                <div>
                  <h1 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                    Property Tracker
                  </h1>
                  <p className="text-xs text-slate-400 -mt-0.5">Ceny mieszkań w Polsce</p>
                </div>
              </a>
              <nav className="flex items-center gap-4 text-sm text-slate-400">
                <a href="/" className="hover:text-white transition-colors">Dashboard</a>
              </nav>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
