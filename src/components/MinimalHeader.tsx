'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function MinimalHeader() {
  return (
    <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center">
        <Link href="/" className="flex items-center">
          <Image
            src="/gapply-logo.png"
            alt="Gapply"
            width={120}
            height={40}
            className="object-contain"
            priority
          />
        </Link>
      </div>
    </header>
  )
}
