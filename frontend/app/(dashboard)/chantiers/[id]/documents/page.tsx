import Link from 'next/link'
import { Download, FileText, ArrowLeft, FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DocumentUploader } from '@/components/chantier/DocumentUploader'
import { apiFetch } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Document, DocumentType, DocumentStatus } from '@/lib/types'

interface DocumentsPageProps {
  params: Promise<{ id: string }>
}

const typeLabels: Record<DocumentType, string> = {
  devis: 'Devis',
  facture: 'Facture',
  plan: 'Plan',
  autre: 'Autre',
}

const statusConfig: Record<
  NonNullable<DocumentStatus>,
  { label: string; className: string }
> = {
  en_attente: { label: 'En attente', className: 'bg-gray-100 text-gray-700' },
  accepte: { label: 'Accepté', className: 'bg-green-100 text-green-700' },
  refuse: { label: 'Refusé', className: 'bg-red-100 text-red-700' },
  paye: { label: 'Payé', className: 'bg-blue-100 text-blue-700' },
  en_retard: { label: 'En retard', className: 'bg-orange-100 text-orange-700' },
}

async function getDocuments(chantierId: string): Promise<Document[]> {
  try {
    return await apiFetch<Document[]>(`/api/chantiers/${chantierId}/documents`)
  } catch {
    return []
  }
}

export default async function DocumentsPage({ params }: DocumentsPageProps) {
  const { id } = await params
  const documents = await getDocuments(id)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/chantiers/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </Link>
        <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
      </div>

      {/* Upload */}
      <DocumentUploader chantierId={id} />

      {/* Document list */}
      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <FileText className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-gray-500">Aucun document pour ce chantier</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-white divide-y">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between px-4 py-3"
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
                    {doc.status && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig[doc.status].className}`}
                      >
                        {statusConfig[doc.status].label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/documents/${doc.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <FileDown className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                </a>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/chantiers/${id}/documents/${doc.id}/download`}
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
      )}
    </div>
  )
}
