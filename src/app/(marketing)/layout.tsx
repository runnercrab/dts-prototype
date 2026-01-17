// src/app/(marketing)/layout.tsx
import Header from '@/components/Header'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
    </>
  )
}
