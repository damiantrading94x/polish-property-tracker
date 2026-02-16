import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Polish Property Tracker – Ceny mieszkań',
  description: 'Śledzenie cen mieszkań od deweloperów i cen transakcyjnych w polskich miastach',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="min-h-screen antialiased">
        <header className="border-b border-white/[0.04] bg-[#0a0f1a]/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <a href="/" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-base font-semibold text-white group-hover:text-indigo-400 transition-colors">
                    Property Tracker
                  </h1>
                  <p className="text-[11px] text-slate-500 -mt-0.5 font-medium">Ceny mieszkań w Polsce</p>
                </div>
              </a>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-600 font-medium hidden sm:block">Dane z Otodom & RCN</span>
              </div>
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
