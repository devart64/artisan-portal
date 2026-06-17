'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { SidebarContent } from '@/components/shared/SidebarContent'

/**
 * Hamburger button + slide-in navigation drawer for mobile/tablet (<lg).
 * Closes automatically on route change and locks body scroll while open.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Prevent the page behind the drawer from scrolling.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        className="-ml-2 flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100"
      >
        <Menu className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          {/* Overlay */}
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          {/* Drawer panel */}
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] border-r bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer le menu"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
