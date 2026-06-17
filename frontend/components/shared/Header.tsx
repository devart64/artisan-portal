'use client'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, User } from 'lucide-react'
import { NotificationBell } from '@/components/shared/NotificationBell'
import { MobileNav } from '@/components/shared/MobileNav'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/chantiers': 'Chantiers',
  '/chantiers/new': 'Nouveau chantier',
  '/clients': 'Clients',
  '/settings': 'Paramètres',
  '/settings/billing': 'Facturation',
}

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname]
  if (pathname.startsWith('/chantiers/') && pathname.includes('/documents'))
    return 'Documents'
  if (pathname.startsWith('/chantiers/') && pathname.includes('/photos'))
    return 'Photos'
  if (pathname.startsWith('/chantiers/') && pathname.includes('/planning'))
    return 'Planning'
  if (pathname.startsWith('/chantiers/') && pathname.includes('/messages'))
    return 'Messages'
  if (pathname.startsWith('/chantiers/')) return 'Détail du chantier'
  return 'ArtisanPortal'
}

export function Header() {
  const pathname = usePathname()
  const title = getPageTitle(pathname)

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <MobileNav />
        <h1 className="truncate text-lg font-semibold text-gray-900 lg:text-xl">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                A
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/settings" className="flex items-center gap-2 cursor-pointer">
              <User className="h-4 w-4" />
              Paramètres
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <form action={logout} className="w-full">
              <button
                type="submit"
                className="flex w-full items-center gap-2 text-red-600"
              >
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  )
}
