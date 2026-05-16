'use client'

import { useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { Document, DocumentType, DocumentStatus } from '@/lib/types'
import SignatureModal from './SignatureModal'

const typeLabels: Record<DocumentType, string> = {
  devis: 'Devis',
  facture: 'Facture',
  plan: 'Plan',
  autre: 'Autre',
}

const statusLabels: Record<NonNullable<DocumentStatus>, string> = {
  en_attente: 'En attente',
  accepte: 'Accepté',
  refuse: 'Refusé',
  paye: 'Payé',
  en_retard: 'En retard',
  signe: 'Signé',
}

const statusColors: Record<NonNullable<DocumentStatus>, string> = {
  en_attente: 'bg-gray-100 text-gray-700',
  accepte: 'bg-green-100 text-green-700',
  refuse: 'bg-red-100 text-red-700',
  paye: 'bg-blue-100 text-blue-700',
  en_retard: 'bg-orange-100 text-orange-700',
  signe: 'bg-green-100 text-green-700',
}

interface PortalDocumentsProps {
  documents: Document[]
  token: string
}

export function PortalDocuments({ documents: initialDocuments, token }: PortalDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments)
  const [signingDoc, setSigningDoc] = useState<Document | null>(null)

  function handleSigned(signerName: string) {
    if (!signingDoc) return
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === signingDoc.id
          ? {
              ...doc,
              status: 'signe' as DocumentStatus,
              signerName,
              signedAt: new Date().toISOString(),
            }
          : doc,
      ),
    )
    setSigningDoc(null)
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <FileText className="mb-3 h-10 w-10 text-gray-300" />
        <p className="text-gray-500">Aucun document disponible</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between rounded-lg border bg-white p-4"
          >
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 shrink-0 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{doc.label}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {typeLabels[doc.type]}
                  </span>
                  <span className="text-xs text-gray-300">•</span>
                  <span className="text-xs text-gray-500">
                    {formatDate(doc.createdAt)}
                  </span>
                  {doc.status && doc.status !== 'signe' && (
                    <>
                      <span className="text-xs text-gray-300">•</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[doc.status]}`}
                      >
                        {statusLabels[doc.status]}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {doc.status === 'signe' && (
                <div className="text-xs text-green-700 bg-green-50 rounded px-2 py-1">
                  ✅ Signé{doc.signerName ? ` par ${doc.signerName}` : ''}{doc.signedAt ? ` le ${new Date(doc.signedAt).toLocaleDateString('fr-FR')}` : ''}
                </div>
              )}

              {(doc.status === 'en_attente' || !doc.status) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                  onClick={() => setSigningDoc(doc)}
                >
                  ✍️ Signer
                </Button>
              )}

              <a
                href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/portal/${token}/documents/${doc.id}/download`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger
                </Button>
              </a>
            </div>
          </div>
        ))}
      </div>

      <SignatureModal
        open={signingDoc !== null}
        documentLabel={signingDoc?.label ?? ''}
        token={token}
        documentId={signingDoc?.id ?? ''}
        onClose={() => setSigningDoc(null)}
        onSigned={handleSigned}
      />
    </>
  )
}
