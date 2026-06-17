'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  HardHat,
  Users,
  Settings,
  LogOut,
  Wrench,
  UsersRound,
  UserCircle,
  Key,
  ShieldCheck,
  ClipboardList,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/lib/auth'

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/chantiers', label: 'Chantiers', icon: HardHat },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/settings', label: 'Paramètres', icon: Settings },
]

const settingsItems = [
  { href: '/settings/team', label: 'Équipe', icon: UsersRound },
  { href: '/settings/account', label: 'Mon compte', icon: UserCircle },
  { href: '/settings/api-keys', label: 'Clés API', icon: Key },
  { href: '/settings/security', label: 'Sécurité (2FA)', icon: ShieldCheck },
  { href: '/settings/audit', label: 'Journal d\'activité', icon: ClipboardList },
  { href: '/settings/export', label: 'Export compta', icon: Download },
]

/**
 * Inner navigation shared by the fixed desktop sidebar and the mobile drawer.
 * `onNavigate` lets the mobile drawer close itself when a link is tapped.
 */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  const linkClass = (isActive: boolean) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-primary/10 text-primary'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
    )

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Wrench className="h-4 w-4" />
        </div>
        <span className="text-lg font-bold text-gray-900">ArtisanPortal</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === '/settings'
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={linkClass(isActive)}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          )
        })}

        <div className="pt-3">
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Compte
          </p>
          {settingsItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={linkClass(isActive)}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Logout */}
      <div className="border-t px-3 py-4">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  )
}
