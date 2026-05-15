'use client'
import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { Send, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatDateTime } from '@/lib/utils'
import type { Message } from '@/lib/types'

interface PortalMessagesProps {
  messages: Message[]
  token: string
}

export function PortalMessages({ messages: initialMessages, token }: PortalMessagesProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const trimmed = content.trim()
    if (!trimmed) return

    setIsSending(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/portal/${token}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: trimmed }),
        },
      )
      if (!res.ok) throw new Error('Erreur lors de l\'envoi')
      const newMessage = await res.json() as Message
      setMessages((prev) => [...prev, newMessage])
      setContent('')
    } catch {
      toast.error('Impossible d\'envoyer le message')
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

  return (
    <div className="flex flex-col" style={{ height: '60vh' }}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-gray-500">Aucun message. Commencez la conversation !</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderType === 'client' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs rounded-2xl px-4 py-3 lg:max-w-md ${
                msg.senderType === 'client'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-white border text-gray-900 rounded-bl-sm'
              }`}
            >
              {msg.senderName && (
                <p
                  className={`mb-1 text-xs font-semibold ${
                    msg.senderType === 'client'
                      ? 'text-primary-foreground/70'
                      : 'text-gray-500'
                  }`}
                >
                  {msg.senderName}
                </p>
              )}
              <p className="text-sm leading-relaxed">{msg.content}</p>
              <p
                className={`mt-1 text-right text-xs ${
                  msg.senderType === 'client'
                    ? 'text-primary-foreground/60'
                    : 'text-gray-400'
                }`}
              >
                {formatDateTime(msg.createdAt)}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="flex gap-3 pt-4">
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
