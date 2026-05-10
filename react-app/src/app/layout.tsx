import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sales Copilot — Headless 360',
  description: 'Agentforce POC · Salesforce Connections 2026',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geist.className} h-full bg-gray-50 text-gray-900 antialiased`}>
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 sticky top-0 z-50">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
              SC
            </span>
            <span className="font-semibold text-gray-900">Sales Copilot</span>
          </Link>
          <span className="text-xs text-gray-400 border border-gray-200 rounded-full px-2.5 py-0.5">
            Headless 360 POC · CNX26
          </span>
          <div className="ml-auto flex items-center gap-4 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-900">Dashboard</Link>
            <span className="text-gray-300">|</span>
            <span className="text-xs text-gray-400">Salesforce SDO Lite</span>
          </div>
        </nav>
        <main className="p-6">
          {children}
        </main>
      </body>
    </html>
  )
}
