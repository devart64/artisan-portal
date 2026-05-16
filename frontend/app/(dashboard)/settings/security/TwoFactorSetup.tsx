'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Shield, ShieldCheck, QrCode } from 'lucide-react'
import { setup2FA, enable2FA, disable2FA, get2FAStatus } from './actions'

export function TwoFactorSetup() {
  const [enabled, setEnabled]       = useState(false)
  const [loading, setLoading]       = useState(true)
  const [qrUrl, setQrUrl]           = useState('')
  const [secret, setSecret]         = useState('')
  const [code, setCode]             = useState('')
  const [error, setError]           = useState('')
  const [step, setStep]             = useState<'idle' | 'setup' | 'disable'>('idle')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    get2FAStatus().then(s => { setEnabled(s.enabled); setLoading(false) })
  }, [])

  function handleSetup() {
    setError('')
    startTransition(async () => {
      const res = await setup2FA()
      if (res.error) { setError(res.error); return }
      setQrUrl(res.otpauthUrl!)
      setSecret(res.secret!)
      setStep('setup')
    })
  }

  function handleEnable(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const res = await enable2FA(code)
      if (res.error) { setError(res.error); return }
      setEnabled(true)
      setStep('idle')
      setCode('')
      setQrUrl('')
    })
  }

  function handleDisable(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const res = await disable2FA(code)
      if (res.error) { setError(res.error); return }
      setEnabled(false)
      setStep('idle')
      setCode('')
    })
  }

  if (loading) return <div className="animate-pulse h-32 bg-muted rounded-lg" />

  return (
    <div className="border rounded-lg p-6 bg-card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {enabled
            ? <ShieldCheck className="h-6 w-6 text-green-500" />
            : <Shield className="h-6 w-6 text-muted-foreground" />
          }
          <div>
            <h2 className="font-semibold">Authentification à deux facteurs</h2>
            <p className="text-muted-foreground text-sm">
              Utilise une app comme Google Authenticator ou Authy
            </p>
          </div>
        </div>
        <Badge variant={enabled ? 'default' : 'secondary'}>
          {enabled ? 'Activée' : 'Désactivée'}
        </Badge>
      </div>

      {/* Idle — boutons d'action */}
      {step === 'idle' && (
        <div className="pt-2">
          {!enabled ? (
            <Button onClick={handleSetup} disabled={isPending} className="gap-2">
              <QrCode className="h-4 w-4" />
              Configurer le 2FA
            </Button>
          ) : (
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive border-destructive/30"
              onClick={() => setStep('disable')}
            >
              Désactiver le 2FA
            </Button>
          )}
        </div>
      )}

      {/* Setup — QR code + vérification */}
      {step === 'setup' && (
        <div className="space-y-4 pt-2">
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-sm font-medium mb-3">
              Scannez ce QR code avec Google Authenticator ou Authy
            </p>
            <div className="inline-block bg-white p-3 rounded-lg border">
              {/* Afficher le QR code via une API externe — sécurisé car l'URL OTP est locale */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrUrl)}`}
                alt="QR Code 2FA"
                width={180}
                height={180}
                className="rounded"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Ou entrez manuellement : <code className="bg-muted px-1 rounded font-mono">{secret}</code>
            </p>
          </div>

          <form onSubmit={handleEnable} className="space-y-3">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="Code à 6 chiffres"
              value={code}
              onChange={e => setCode(e.target.value)}
              className="text-center text-xl tracking-widest font-mono"
              required
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={isPending || code.length !== 6} className="flex-1">
                Vérifier et activer
              </Button>
              <Button type="button" variant="outline" onClick={() => setStep('idle')}>
                Annuler
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Disable — vérification avant désactivation */}
      {step === 'disable' && (
        <form onSubmit={handleDisable} className="space-y-3 pt-2">
          <p className="text-sm text-muted-foreground">
            Entrez un code de votre application pour confirmer la désactivation.
          </p>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="Code à 6 chiffres"
            value={code}
            onChange={e => setCode(e.target.value)}
            className="text-center text-xl tracking-widest font-mono"
            required
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" variant="destructive" disabled={isPending || code.length !== 6} className="flex-1">
              Désactiver
            </Button>
            <Button type="button" variant="outline" onClick={() => setStep('idle')}>
              Annuler
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
