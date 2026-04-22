import { storeSeedArrayIfMissing } from './store'

export type PartnerAcademyStatus = 'Attivo' | 'In formazione' | 'Certificato'

export type PartnerRecord = {
  id: string
  name: string
  city: string
  partnerType: string
  academyStatus: PartnerAcademyStatus
  /** Optional: e.g. federazione immobiliare, network */
  channelNote?: string
}

const PARTNERS_KEY = 'ems_partners'

const defaultPartners: PartnerRecord[] = [
  {
    id: 'PRT-01',
    name: 'Centro Multiservizi Duomo',
    city: 'Nola',
    partnerType: 'Centro multiservizi',
    academyStatus: 'Attivo',
    channelNote: 'SOS Academy',
  },
  {
    id: 'PRT-02',
    name: 'Agenzia Immobiliare Metrocasa',
    city: 'Napoli',
    partnerType: 'Agenzia immobiliare',
    academyStatus: 'Attivo',
    channelNote: 'Network agenzie',
  },
  {
    id: 'PRT-03',
    name: 'Ricevitoria Litterio',
    city: 'Grammichele',
    partnerType: 'Ricevitoria',
    academyStatus: 'Certificato',
    channelNote: 'SOS Point',
  },
  {
    id: 'PRT-04',
    name: 'Cartolibreria Centrale Verona',
    city: 'Verona',
    partnerType: 'Cartolibreria',
    academyStatus: 'In formazione',
    channelNote: 'SOS Academy',
  },
  {
    id: 'PRT-05',
    name: 'Studio Assicurativo Adriatico',
    city: 'Salerno',
    partnerType: 'Intermediario assicurativo',
    academyStatus: 'Attivo',
  },
]

function normalizePartner(raw: unknown): PartnerRecord | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.id !== 'string' || typeof r.name !== 'string' || typeof r.city !== 'string') return null

  if (r.academyStatus && typeof r.academyStatus === 'string') {
    return {
      id: r.id,
      name: r.name,
      city: r.city,
      partnerType: typeof r.partnerType === 'string' ? r.partnerType : 'Partner',
      academyStatus: r.academyStatus as PartnerAcademyStatus,
      channelNote: typeof r.channelNote === 'string' ? r.channelNote : undefined,
    }
  }

  const legacyStatus = r.status === 'Pending' ? 'In formazione' : 'Attivo'
  return {
    id: r.id,
    name: r.name,
    city: r.city,
    partnerType: 'Centro multiservizi',
    academyStatus: legacyStatus as PartnerAcademyStatus,
  }
}

export function seedPartnersIfMissing() {
  storeSeedArrayIfMissing(PARTNERS_KEY, defaultPartners)
}

export function getPartners(): PartnerRecord[] {
  if (typeof window === 'undefined') return []
  seedPartnersIfMissing()
  const raw = window.localStorage.getItem(PARTNERS_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown[]
    return parsed.map((row) => normalizePartner(row)).filter(Boolean) as PartnerRecord[]
  } catch {
    return []
  }
}

export function savePartners(next: PartnerRecord[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PARTNERS_KEY, JSON.stringify(next))
}

export function createPartner(input: Omit<PartnerRecord, 'id'>): PartnerRecord {
  const row: PartnerRecord = { ...input, id: `PRT-${Date.now()}` }
  savePartners([row, ...getPartners()])
  return row
}

export function updatePartner(id: string, patch: Partial<Omit<PartnerRecord, 'id'>>) {
  const next = getPartners().map((item) => (item.id === id ? { ...item, ...patch } : item))
  savePartners(next)
}

export function deletePartner(id: string) {
  savePartners(getPartners().filter((item) => item.id !== id))
}

export function resetPartners() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(PARTNERS_KEY)
  seedPartnersIfMissing()
}
