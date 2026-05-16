import axios from 'axios'
import { config } from './config.js'
import type { Lead } from './types.js'

const http = axios.create({
  baseURL: config.portalApiUrl,
  headers: { Authorization: `Bearer ${config.portalApiToken}` },
  timeout: 10_000,
})

export const portalClient = {
  async createLead(lead: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> {
    const { data } = await http.post<Lead>('/api/leads', lead)
    return data
  },

  async updateLead(id: string, patch: Partial<Lead>): Promise<Lead> {
    const { data } = await http.patch<Lead>(`/api/leads/${id}`, patch)
    return data
  },

  async getLeads(status?: string): Promise<Lead[]> {
    const params = status ? { status } : {}
    const { data } = await http.get<Lead[]>('/api/leads', { params })
    return data
  },

  async getPendingLeads(): Promise<Lead[]> {
    const { data } = await http.get<Lead[]>('/api/leads/pending')
    return data
  },
}
