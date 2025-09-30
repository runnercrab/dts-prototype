import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DTS — Digital Transformation Score',
  description: 'Radar de madurez digital y asistente',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        <header className="border-b border-neutral-800 px-6 py-4">
          <h1 className="text-xl font-bold text-green-500">Digital Transformation Score</h1>
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}
