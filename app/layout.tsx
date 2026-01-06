import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'
import { SuppressHydrationWarning } from '@/components/suppress-hydration-warning'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CMS Moderno - Sistema de Gerenciamento de Conteúdo',
  description: 'Sistema completo de gerenciamento de conteúdo multi-organização com IA integrada',
  keywords: ['CMS', 'Content Management', 'Multi-tenant', 'WordPress', 'AI'],
  authors: [{ name: 'CMS Team' }],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <a href="#main-content" className="skip-link">
          Ir para o conteúdo principal
        </a>
        <SuppressHydrationWarning />
        <Providers>
          {children}
          {/* <MigrationNotification /> */} {/* REMOVIDO - Migração desativada */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--gray-800)',
                color: 'var(--white)',
              },
              success: {
                style: {
                  background: 'var(--success)',
                },
              },
              error: {
                style: {
                  background: 'var(--danger)',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
