export interface Lead {
  id?: string
  name: string
  email?: string
  phone?: string
  trade: string
  city?: string
  source?: string
  score?: number
  status?: 'new' | 'qualified' | 'contacted' | 'replied' | 'converted' | 'lost'
  notes?: string
  lastContactedAt?: string
  createdAt?: string
}

export interface ProspectQuery {
  trade: string
  city: string
  count?: number
}

export interface QualificationResult {
  score: number
  reasoning: string
  recommendation: 'contact' | 'skip' | 'priority'
}

export interface OutreachContent {
  subject: string
  emailBody: string
  smsText?: string
  followUpDelay: number // days
}

export interface AgentResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  agentName: string
  timestamp: string
}
