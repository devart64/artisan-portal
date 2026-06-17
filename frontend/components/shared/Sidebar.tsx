import { SidebarContent } from '@/components/shared/SidebarContent'

/**
 * Fixed sidebar shown on large screens only. On mobile the same navigation is
 * available through the hamburger drawer (see MobileNav).
 */
export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r bg-white lg:flex">
      <SidebarContent />
    </aside>
  )
}
