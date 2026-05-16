import { NextRequest, NextResponse } from 'next/server'
import { getJwt } from '@/lib/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params
  const jwt = await getJwt()

  if (!jwt) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  const upstream = await fetch(`${API_URL}/api/documents/${id}/pdf`, {
    headers: { Authorization: `Bearer ${jwt}` },
  })

  if (!upstream.ok) {
    return NextResponse.json(
      { error: 'Impossible de générer le PDF.' },
      { status: upstream.status },
    )
  }

  const pdfBuffer = await upstream.arrayBuffer()

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': upstream.headers.get('Content-Disposition') ?? 'attachment; filename="document.pdf"',
    },
  })
}
