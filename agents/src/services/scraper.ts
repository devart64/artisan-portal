import axios from 'axios'
import type { Lead } from '../types.js'

// Codes NAF par métier d'artisan
const NAF_CODES: Record<string, string> = {
  plombier: '43.22A',
  electricien: '43.21A',
  peintre: '43.34Z',
  macon: '43.99C',
  menuisier: '43.32A',
  carreleur: '43.33Z',
  charpentier: '43.91A',
  platrier: '43.31Z',
  couvreur: '43.91B',
  serrurier: '43.29A',
}

interface SireneCompany {
  nom_complet: string
  siege: {
    adresse?: string
    commune?: string
    code_postal?: string
    departement?: string
  }
  dirigeants?: Array<{ nom?: string; prenoms?: string; qualite?: string }>
  activite_principale?: string
  tranche_effectif_salarie?: string
}

interface SireneResponse {
  results: SireneCompany[]
  total_results: number
}

export async function scrapeLeads(
  trade: string,
  city: string,
  count = 10,
): Promise<Omit<Lead, 'id' | 'status' | 'createdAt'>[]> {
  const nafCode = NAF_CODES[trade.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')]

  const params: Record<string, string | number> = {
    per_page: Math.min(count, 25),
    mtc: 'true',
  }

  if (nafCode) {
    params.activite_principale = nafCode
  }
  // Toujours chercher par ville
  params.q = city

  const { data } = await axios.get<SireneResponse>(
    'https://recherche-entreprises.api.gouv.fr/search',
    { params, timeout: 15_000 },
  )

  return (data.results ?? []).slice(0, count).map((r) => {
    const dirigeant = r.dirigeants?.find(d => d.qualite === 'Directeur général' || d.qualite === 'Gérant' || d.prenoms)
    const contactName = dirigeant
      ? `${dirigeant.prenoms ?? ''} ${dirigeant.nom ?? ''}`.trim()
      : r.nom_complet

    return {
      name: contactName,
      trade,
      city: r.siege?.commune ?? city,
      source: 'sirene_api',
      score: 0,
      notes: `Société: ${r.nom_complet} | CP: ${r.siege?.code_postal ?? ''} | NAF: ${r.activite_principale ?? ''}`,
      // Email et téléphone nécessitent un enrichissement (Hunter.io ou manuel)
      email: undefined,
      phone: undefined,
    }
  })
}
