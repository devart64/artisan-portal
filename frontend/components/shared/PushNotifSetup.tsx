'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PushNotifSetup() {
  const [supported, setSupported]   = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading]       = useState(false)

  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true)
      setPermission(Notification.permission)

      // Vérifier si déjà subscrit
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setSubscribed(sub !== null)
        })
      })
    }
  }, [])

  async function subscribe() {
    setLoading(true)
    try {
      // Récupérer la clé VAPID publique
      const keyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/push/vapid-public-key`, {
        credentials: 'include',
      })
      const { publicKey } = await keyRes.json()

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      // Envoyer la subscription au backend
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/push/subscribe`, {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify(sub.toJSON()),
      })

      setSubscribed(true)
      setPermission('granted')
    } catch (e) {
      console.error('Push subscribe error:', e)
    } finally {
      setLoading(false)
    }
  }

  async function unsubscribe() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/push/unsubscribe`, {
          method:      'POST',
          credentials: 'include',
          headers:     { 'Content-Type': 'application/json' },
          body:        JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setSubscribed(false)
    } catch {}
    setLoading(false)
  }

  if (!supported) return null

  return (
    <div className="flex items-center gap-3">
      {subscribed ? (
        <>
          <span className="text-xs text-green-600 flex items-center gap-1">
            <Bell className="h-3 w-3" /> Notifications activées
          </span>
          <Button variant="ghost" size="sm" onClick={unsubscribe} disabled={loading}>
            <BellOff className="h-4 w-4 mr-1" /> Désactiver
          </Button>
        </>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={subscribe}
          disabled={loading || permission === 'denied'}
        >
          <Bell className="h-4 w-4 mr-1" />
          {permission === 'denied' ? 'Notifications bloquées' : 'Activer les notifications'}
        </Button>
      )}
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(base64)
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}
