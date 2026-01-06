'use client'

import { Sidebar } from './sidebar'
import { Header } from './header'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="cms-layout">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="cms-main">
        {/* Header */}
        <Header />
        
        {/* Page content */}
        <main id="main-content" className="cms-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  )
}
