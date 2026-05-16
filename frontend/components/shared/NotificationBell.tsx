'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface NotifItem {
  id: string
  type: string
  title: string
  body?: string
  url?: string
  read: boolean
  createdAt: string
}

interface NotifResponse {
  unread: number
  items: NotifItem[]
}

export function NotificationBell() {
  const [data, setData]       = useState<NotifResponse>({ unread: 0, items: [] })
  const [open, setOpen]       = useState(false)

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
        credentials: 'include',
      })
      if (res.ok) setData(await res.json())
    } catch {}
  }, [])

  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30_000)
    return () => clearInterval(interval)
  }, [fetchNotifs])

  async function markAllRead() {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/read-all`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {})
    setData(prev => ({
      ...prev,
      unread: 0,
      items: prev.items.map(n => ({ ...n, read: true })),
    }))
  }

  function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'À l\'instant'
    if (m < 60) return `Il y a ${m} min`
    const h = Math.floor(m / 60)
    if (h < 24) return `Il y a ${h}h`
    return `Il y a ${Math.floor(h / 24)}j`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {data.unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
              {data.unread > 9 ? '9+' : data.unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold text-sm">Notifications</span>
          {data.unread > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-blue-600 hover:underline"
            >
              Tout marquer lu
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto divide-y">
          {data.items.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">Aucune notification</p>
          ) : (
            data.items.map(n => (
              <div
                key={n.id}
                className={`px-4 py-3 hover:bg-muted/50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
              >
                <div className="flex items-start gap-2">
                  {!n.read && <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />}
                  <div className={!n.read ? '' : 'ml-4'}>
                    <p className="text-sm font-medium leading-tight">{n.title}</p>
                    {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
