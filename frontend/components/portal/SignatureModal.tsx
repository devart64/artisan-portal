'use client'

import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface SignatureModalProps {
  open: boolean
  documentLabel: string
  token: string
  documentId: string
  onClose: () => void
  onSigned: (signerName: string) => void
}

export default function SignatureModal({
  open,
  documentLabel,
  token,
  documentId,
  onClose,
  onSigned,
}: SignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [signerName, setSignerName] = useState('')
  const [hasSignature, setHasSignature] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!open) {
      setSignerName('')
      setHasSignature(false)
      setError('')
      clearCanvas()
    }
  }, [open])

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current
    if (!canvas) return
    e.preventDefault()
    setIsDrawing(true)
    lastPos.current = getPos(e, canvas)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    e.preventDefault()
    const ctx = canvas.getContext('2d')
    if (!ctx || !lastPos.current) return

    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPos.current = pos
    setHasSignature(true)
  }

  function stopDraw() {
    setIsDrawing(false)
    lastPos.current = null
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  async function handleSubmit() {
    if (!signerName.trim()) { setError('Veuillez entrer votre nom complet.'); return }
    if (!hasSignature) { setError('Veuillez apposer votre signature.'); return }

    const canvas = canvasRef.current
    if (!canvas) return
    const signatureData = canvas.toDataURL('image/png')

    setLoading(true)
    setError('')
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/portal/${token}/documents/${documentId}/sign`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signerName: signerName.trim(), signatureData }),
        },
      )
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erreur lors de la signature')
      }
      onSigned(signerName.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Signer le document</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-gray-900">{documentLabel}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signerName">Votre nom complet *</Label>
            <Input
              id="signerName"
              placeholder="Prénom Nom"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Votre signature *</Label>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Effacer
              </button>
            </div>
            <canvas
              ref={canvasRef}
              width={460}
              height={140}
              className="w-full rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 touch-none cursor-crosshair"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
            <p className="text-xs text-gray-400">Dessinez votre signature dans le cadre ci-dessus</p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
            En signant, vous acceptez que cette signature électronique soit légalement équivalente
            à une signature manuscrite. La date, l&apos;heure et votre adresse IP sont enregistrées.
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
              {loading ? 'Signature en cours...' : '✅ Signer le document'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
