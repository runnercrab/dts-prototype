import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const montserrat = Montserrat({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Gapply — Transformación Digital para PYMEs',
  description: 'Transforma tu negocio con decisiones digitales inteligentes. Evaluación rápida de madurez digital con plan personalizado para PYMEs.',
  keywords: ['transformación digital', 'madurez digital', 'pymes', 'diagnóstico digital', 'TM Forum', 'DMM'],
  authors: [{ name: 'Gapply' }],
  icons: {
    icon: '/gapply-logo.png',
    shortcut: '/gapply-logo.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Gapply — Transformación Digital para PYMEs',
    description: 'Evaluación de madurez digital con metodología TM Forum DMM v5.0.1 para PYMEs',
    type: 'website',
    locale: 'es_ES',
    siteName: 'Gapply',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={montserrat.className}>
        <Navbar />
        {children}
      </body>
    </html>
  )
}
