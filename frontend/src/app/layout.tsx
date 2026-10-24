import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Web Reportería',
  description: 'Plataforma de reportería transaccional',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body>
        {children}
        <Toaster
          position="top-right"
          theme="dark"
          richColors
          toastOptions={{
            style: {
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-primary)',
            },
          }}
        />
      </body>
    </html>
  );
}
