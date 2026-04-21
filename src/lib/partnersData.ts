export type PartnerRecord = {
  id: string
  name: string
  city: string
  status: 'Active' | 'Pending'
}

const PARTNERS_KEY = 'ems_partners'

const defaultPartners: PartnerRecord[] = [
  { id: 'PRT-01', name: 'Agenzia Napoli Sud', city: 'Napoli', status: 'Active' },
  { id: 'PRT-02', name: 'Studio Lazio Services', city: 'Roma', status: 'Active' },
  { id: 'PRT-03', name: 'Milano Visa Point', city: 'Milano', status: 'Pending' },
]

export function seedPartnersIfMissing() {
  if (typeof window === 'undefined') return
  if (!window.localStorage.getItem(PARTNERS_KEY)) {
    window.localStorage.setItem(PARTNERS_KEY, JSON.stringify(defaultPartners))
  }
}

export function getPartners(): PartnerRecord[] {
  if (typeof window === 'undefined') return []
  seedPartnersIfMissing()
  const raw = window.localStorage.getItem(PARTNERS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as PartnerRecord[]
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
