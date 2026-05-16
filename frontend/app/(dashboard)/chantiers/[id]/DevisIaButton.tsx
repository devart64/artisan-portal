'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Sparkles } from 'lucide-react'

export function DevisIaButton({ chantierId }: { chantierId: string }) {
  const [open, setOpen]             = useState(false)
  const [devis, setDevis]           = useState('')
  const [error, setError]           = useState('')
  const [isPending, startTransition] = useTransition()

  function generate() {
    setError('')
    setDevis('')
    setOpen(true)
    startTransition(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/ai/chantiers/${chantierId}/devis`,
          { method: 'POST', credentials: 'include' }
        )
        const body = await res.json()
        if (!res.ok) {
          setError(body.error || 'Erreur IA.')
          return
        }
        setDevis(body.devis)
      } catch {
        setError('Impossible de contacter l\'IA.')
      }
    })
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(devis).catch(() => {})
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={generate} className="gap-2">
        <Sparkles className="h-4 w-4 text-purple-500" />
        Générer un devis IA
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Devis généré par l'IA
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {isPending && !devis && (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="flex gap-1">
                  <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                  <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                  <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
                </div>
                <span className="ml-3">L'IA rédige votre devis…</span>
              </div>
            )}
            {error && <p className="text-destructive text-sm p-4">{error}</p>}
            {devis && (
              <pre className="whitespace-pre-wrap text-sm p-4 bg-muted rounded-lg font-mono text-xs leading-relaxed">
                {devis}
              </pre>
            )}
          </div>
          {devis && (
            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" onClick={copyToClipboard} className="flex-1">
                Copier le texte
              </Button>
              <Button onClick={() => setOpen(false)} className="flex-1">
                Fermer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
