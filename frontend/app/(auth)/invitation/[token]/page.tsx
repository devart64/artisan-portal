'use client'

import { useState, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function InvitationPage() {
  const params   = useParams<{ token: string }>()
  const router   = useRouter()
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('8 caractères minimum.'); return }
    setError('')
    startTransition(async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/invitation/accept/${params.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error || 'Lien invalide ou expiré.')
        return
      }
      const { token } = await res.json()
      document.cookie = `jwt=${token}; path=/; SameSite=Lax`
      router.push('/dashboard')
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border p-8">
        <h1 className="text-xl font-bold mb-2">Rejoindre l'équipe</h1>
        <p className="text-muted-foreground text-sm mb-6">Choisissez votre mot de passe pour activer votre compte.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Mot de passe (8 caractères min.)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Activation…' : 'Activer mon compte'}
          </Button>
        </form>
      </div>
    </div>
  )
}
