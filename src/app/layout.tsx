import './globals.css'
import type { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'DTS — Digital Transformation Score',
  description: 'Radar de madurez digital y asistente',
}

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  // Solo activar analytics en producción O si está habilitado en .env.local
  const enableAnalytics = 
    process.env.NODE_ENV === 'production' || 
    process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'
  
  const contentsquareUrl = process.env.NEXT_PUBLIC_CONTENTSQUARE_URL

  return (
    <html lang="es" className="dark">
      <head>
        {/* Contentsquare + Hotjar (solo en producción) */}
        {enableAnalytics && contentsquareUrl && (
          <Script
            src={contentsquareUrl}
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        <header className="border-b border-neutral-800 px-6 py-4">
          <h1 className="text-xl font-bold text-green-500">
            Digital Transformation Score
          </h1>
        </header>

        <main>{children}</main>
      </body>
    </html>
  )
}