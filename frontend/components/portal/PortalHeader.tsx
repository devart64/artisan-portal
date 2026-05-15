import Image from 'next/image'
import type { Tenant } from '@/lib/types'

interface PortalHeaderProps {
  tenant: Tenant
}

export function PortalHeader({ tenant }: PortalHeaderProps) {
  return (
    <header
      className="border-b bg-white px-6 py-4"
      style={{ borderTopColor: tenant.brandColor, borderTopWidth: 3 }}
    >
      <div className="mx-auto flex max-w-4xl items-center gap-4">
        {tenant.logoUrl ? (
          <Image
            src={tenant.logoUrl}
            alt={tenant.name}
            width={40}
            height={40}
            className="h-10 w-10 rounded-lg object-contain"
          />
        ) : (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white text-sm font-bold"
            style={{ backgroundColor: tenant.brandColor }}
          >
            {tenant.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-lg font-bold text-gray-900">{tenant.name}</h1>
          <p className="text-xs text-gray-500">Portail client</p>
        </div>
      </div>
    </header>
  )
}
