export type Plan = 'starter' | 'pro' | 'business'
export type PlanStatus = 'trialing' | 'active' | 'past_due' | 'canceled'
export type ChantierStatus = 'en_attente' | 'en_cours' | 'termine' | 'annule'
export type DocumentType = 'devis' | 'facture' | 'plan' | 'autre'
export type DocumentStatus = 'en_attente' | 'accepte' | 'refuse' | 'paye' | 'en_retard' | 'signe'

export interface Tenant {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  brandColor: string
  plan: Plan
  planStatus: PlanStatus
}

export interface Chantier {
  id: string
  title: string
  description: string | null
  status: ChantierStatus
  startDate: string | null
  endDate: string | null
  address: string | null
  client: Client | null
  createdAt: string
  updatedAt: string | null
}

export interface Document {
  id: string
  type: DocumentType
  label: string
  status: DocumentStatus | null
  createdAt: string
  signedAt?: string
  signerName?: string
}

export interface Photo {
  id: string
  signedUrl: string
  caption: string | null
  uploadedAt: string
}

export interface Message {
  id: string
  senderType: 'artisan' | 'client'
  senderName: string | null
  content: string
  read: boolean
  createdAt: string
}

export interface Jalon {
  id: string
  title: string
  date: string | null
  done: boolean
}

export interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
}

export interface PortalData {
  chantier: Chantier
  tenant: Tenant
  jalonsProgress: number // percentage 0-100
}
