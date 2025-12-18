'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'
import MinimalHeader from '@/components/MinimalHeader'

export default function Header() {
  const pathname = usePathname()

  // En /start NO queremos CTAs ni navegación (solo logo)
  if (pathname === '/start') {
    return <MinimalHeader />
  }

  return <Navbar />
}
