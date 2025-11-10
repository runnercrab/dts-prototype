import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'  // ← Cambiar a Montserrat
import './globals.css'
import Navbar from '@/components/Navbar'

const montserrat = Montserrat({  // ← Usar Montserrat
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Gapply — Digital Transformation Score',
  description: 'Transforma tu negocio con decisiones digitales inteligentes. Evaluación rápida de madurez digital con plan personalizado para PYMEs.',
  keywords: ['transformación digital', 'madurez digital', 'pymes', 'diagnóstico digital', 'TM Forum'],
  openGraph: {
    title: 'Gapply — Digital Transformation Score',
    description: 'Evaluación de madurez digital con metodología TM Forum para PYMEs',
    type: 'website',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={montserrat.className}>  {/* ← Aplicar Montserrat */}
        <Navbar />
        {children}
      </body>
    </html>
  )
}