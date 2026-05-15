'use client'
import { useState, useEffect, useRef, use } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Send, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { apiFetch } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import type { Message } from '@/lib/types'

interface MessagesPageProps {
  params: Promise<{ id: string }>
}

export default function MessagesPage({ params }: MessagesPageProps) {
  const { id } = use(params)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    apiFetch<Message[]>(`/api/chantiers/${id}/messages`)
      .then(setMessages)
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setIsLoading(false))
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const trimmed = content.trim()
    if (!trimmed) return

    setIsSending(true)
    try {
      const newMessage = await apiFetch<Message>(`/api/chantiers/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: trimmed }),
      })
      setMessages((prev) => [...prev, newMessage])
      setContent('')
    } catch {
      toast.error("Erreur lors de l'envoi du message")
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-4" style={{ height: 'calc(100vh - 12rem)' }}>
      {/* Header */}
      <div className="flex items-center gap-4 shrink-0">
        <Link href={`/chantiers/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </Link>
        <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-lg border bg-gray-50 p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-gray-500">Aucun message. Commencez la conversation !</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderType === 'artisan' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs rounded-2xl px-4 py-3 lg:max-w-md ${
                  msg.senderType === 'artisan'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-white border text-gray-900 rounded-bl-sm'
                }`}
              >
                {msg.senderName && (
                  <p
                    className={`mb-1 text-xs font-semibold ${
                      msg.senderType === 'artisan'
                        ? 'text-primary-foreground/70'
                        : 'text-gray-500'
                    }`}
                  >
                    {msg.senderName}
                  </p>
                )}
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <div className={`mt-1 flex items-center justify-end gap-2 ${
                  msg.senderType === 'artisan' ? 'text-primary-foreground/60' : 'text-gray-400'
                }`}>
                  <span className="text-xs">{formatDateTime(msg.createdAt)}</span>
                  {msg.senderType === 'artisan' && !msg.read && (
                    <span className="text-xs">•</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3 shrink-0">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrivez votre message... (Entrée pour envoyer)"
          rows={2}
          className="flex-1 resize-none"
          disabled={isSending}
        />
        <Button
          onClick={handleSend}
          disabled={isSending || !content.trim()}
          className="shrink-0 self-end"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Envoyer</span>
        </Button>
      </div>
    </div>
  )
}
