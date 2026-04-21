import { getSessionUser } from './demoAuth'
import { MANAGER_SCOPE_BRANCH } from './sosDemo'

export type LeadStage = 'New' | 'Contacted' | 'Proposal Sent' | 'Negotiation' | 'Won' | 'Lost'

export type DemoLead = {
  id: string
  company: string
  assignedAgent: string
  branch: string
  stage: LeadStage
  serviceType: string
  contractValue: number | null
  stageAgeDays: number
}

export type ReportStatus = 'Draft' | 'Submitted' | 'Under Review' | 'Accepted' | 'Rejected'

export type DemoReport = {
  id: string
  agent: string
  client: string
  branch: string
  serviceType: string
  submittedOn: string
  status: ReportStatus
  reviewedBy?: string
  rejectionReason?: string
}

export type CommissionStatus = 'Pending' | 'Approved' | 'Paid' | 'Disputed'

export type DemoCommission = {
  id: string
  agent: string
  branch: string
  deal: string
  service: string
  gross: number
  rate: number
  amount: number
  date: string
  status: CommissionStatus
}

export type NotificationType = 'commission' | 'report' | 'system' | 'alert' | 'sync'

export type DemoNotification = {
  id: string
  audienceRole: 'admin' | 'manager' | 'employee'
  audienceName?: string
  type: NotificationType
  text: string
  read: boolean
  createdAt: string
}

export type DemoActivity = {
  id: string
  agent: string
  branch: string
  text: string
  kind: 'create' | 'update' | 'stage' | 'alert'
  createdAt: string
}

const LEADS_KEY = 'ems_leads'
const REPORTS_KEY = 'ems_reports'
const COMMISSIONS_KEY = 'ems_commissions'
const NOTIFICATIONS_KEY = 'ems_notifications'
const ACTIVITY_KEY = 'ems_activity'

const defaultLeads: DemoLead[] = [
  { id: 'lead-001', company: 'Bar Pasticceria Duomo', assignedAgent: 'Teresa Chiarello', branch: 'Nola', stage: 'New', serviceType: 'luce', contractValue: null, stageAgeDays: 2 },
  { id: 'lead-002', company: 'Farmacia Municipio 12', assignedAgent: 'Lucia Mancini', branch: 'Nola', stage: 'Contacted', serviceType: 'gas', contractValue: 90, stageAgeDays: 22 },
  { id: 'lead-003', company: 'Autoricambi Vesuvio', assignedAgent: 'Angelo Ioime', branch: 'Napoli', stage: 'New', serviceType: 'fibra', contractValue: null, stageAgeDays: 31 },
  { id: 'lead-004', company: 'Edilizia Flegrea', assignedAgent: 'Teresa Chiarello', branch: 'Nola', stage: 'Contacted', serviceType: 'luce', contractValue: 120, stageAgeDays: 5 },
  { id: 'lead-005', company: 'B&B Ercolano View', assignedAgent: 'Lucia Mancini', branch: 'Nola', stage: 'Contacted', serviceType: 'assicurazioni', contractValue: 200, stageAgeDays: 12 },
  { id: 'lead-006', company: 'Studio Tecnico Cicciano', assignedAgent: 'Antonio Marrone', branch: 'Cicciano', stage: 'Proposal Sent', serviceType: 'gas', contractValue: 310, stageAgeDays: 18 },
  { id: 'lead-007', company: 'Panificio Gragnano', assignedAgent: 'Teresa Chiarello', branch: 'Nola', stage: 'Negotiation', serviceType: 'luce', contractValue: 160, stageAgeDays: 3 },
  { id: 'lead-008', company: 'Hotel Salerno Mare', assignedAgent: 'Marcella Del Prete', branch: 'Salerno', stage: 'Negotiation', serviceType: 'assicurazioni', contractValue: 800, stageAgeDays: 9 },
  { id: 'lead-009', company: 'Panificio Nola Centro', assignedAgent: 'Lucia Mancini', branch: 'Nola', stage: 'Won', serviceType: 'gas', contractValue: 620, stageAgeDays: 4 },
  { id: 'lead-010', company: 'Autofficina Vesuvio', assignedAgent: 'Teresa Chiarello', branch: 'Nola', stage: 'Won', serviceType: 'luce', contractValue: 480, stageAgeDays: 6 },
  { id: 'lead-011', company: 'Agriturismo Tropea Sud', assignedAgent: 'Attilio Rossi', branch: 'Tropea', stage: 'Won', serviceType: 'mobile', contractValue: 240, stageAgeDays: 9 },
  { id: 'lead-012', company: 'Import Export Nord', assignedAgent: 'Luigi Bergamo', branch: 'Verona', stage: 'Lost', serviceType: 'luce', contractValue: null, stageAgeDays: 14 },
  { id: 'lead-013', company: 'Officina Napoli Vomero', assignedAgent: 'Angelo Ioime', branch: 'Napoli', stage: 'New', serviceType: 'nlt', contractValue: 12000, stageAgeDays: 1 },
  { id: 'lead-014', company: 'Ristorante Lungomare', assignedAgent: 'Lucia Mancini', branch: 'Nola', stage: 'Contacted', serviceType: 'gas', contractValue: 150, stageAgeDays: 8 },
  { id: 'lead-015', company: 'Cantine Etna Società', assignedAgent: 'Tiziana De Pasquale', branch: 'Catania', stage: 'Proposal Sent', serviceType: 'fibra', contractValue: 420, stageAgeDays: 16 },
  { id: 'lead-016', company: 'Abbigliamento Moda Verona', assignedAgent: 'Luigi Bergamo', branch: 'Verona', stage: 'Negotiation', serviceType: 'luce', contractValue: 210, stageAgeDays: 6 },
  { id: 'lead-017', company: 'Logistica Adriatica PMI', assignedAgent: 'Lucia Mancini', branch: 'Nola', stage: 'Won', serviceType: 'assicurazioni', contractValue: 1400, stageAgeDays: 2 },
  { id: 'lead-018', company: 'GDO Campana SRL', assignedAgent: 'Teresa Chiarello', branch: 'Nola', stage: 'Proposal Sent', serviceType: 'luce', contractValue: 890, stageAgeDays: 12 },
  { id: 'lead-019', company: 'Alberghi Toscani SPA', assignedAgent: 'Laura Martini', branch: 'Cerveteri', stage: 'Contacted', serviceType: 'gas', contractValue: 680, stageAgeDays: 21 },
  { id: 'lead-020', company: 'Servizi Energia Puglia', assignedAgent: 'Fabio Rizzato', branch: 'Avetrana', stage: 'Won', serviceType: 'gas', contractValue: 1750, stageAgeDays: 5 },
  { id: 'lead-021', company: 'Farmacie Irno Network', assignedAgent: 'Marcella Del Prete', branch: 'Salerno', stage: 'Negotiation', serviceType: 'assicurazioni', contractValue: 530, stageAgeDays: 11 },
  { id: 'lead-022', company: 'Noleggio Flotta Nord', assignedAgent: 'Luigi Bergamo', branch: 'Verona', stage: 'New', serviceType: 'nlt', contractValue: 42000, stageAgeDays: 4 },
  { id: 'lead-023', company: 'Marittima Salerno SRL', assignedAgent: 'Marcella Del Prete', branch: 'Salerno', stage: 'Lost', serviceType: 'mutui', contractValue: null, stageAgeDays: 19 },
  { id: 'lead-024', company: 'Digitale Sicilia Lab', assignedAgent: 'Tiziana De Pasquale', branch: 'Catania', stage: 'Won', serviceType: 'fibra', contractValue: 980, stageAgeDays: 3 },
  { id: 'lead-025', company: 'Studio Legale Catania Centro', assignedAgent: 'Tiziana De Pasquale', branch: 'Catania', stage: 'Won', serviceType: 'malasanità', contractValue: 5500, stageAgeDays: 7 },
  { id: 'lead-026', company: 'Gommista Verona Nord', assignedAgent: 'Luigi Bergamo', branch: 'Verona', stage: 'Won', serviceType: 'nlt', contractValue: 28000, stageAgeDays: 5 },
]

const defaultReports: DemoReport[] = [
  { id: 'RPT-001', agent: 'Teresa Chiarello', client: 'Giovanni Rinaldi', branch: 'Nola', serviceType: 'Voltura luce', submittedOn: '2025-04-10', status: 'Submitted' },
  { id: 'RPT-002', agent: 'Lucia Mancini', client: 'Sofia Bianchi', branch: 'Nola', serviceType: 'Subentro gas', submittedOn: '2025-04-09', status: 'Accepted', reviewedBy: 'Elena Esposito' },
  { id: 'RPT-003', agent: 'Teresa Chiarello', client: 'Martina Greco', branch: 'Nola', serviceType: 'Recupero morosità pregressa', submittedOn: '2025-04-08', status: 'Rejected', reviewedBy: 'Elena Esposito', rejectionReason: 'Mancano documenti precedente inquilino' },
  { id: 'RPT-004', agent: 'Marcella Del Prete', client: 'Luca Esposito', branch: 'Salerno', serviceType: 'Attivazione fibra FTTH', submittedOn: '2025-04-07', status: 'Submitted' },
  { id: 'RPT-005', agent: 'Teresa Chiarello', client: 'Elena Popescu', branch: 'Nola', serviceType: 'Cambio fornitore mercato libero', submittedOn: '2025-04-05', status: 'Accepted', reviewedBy: 'Elena Esposito' },
  { id: 'RPT-006', agent: 'Lucia Mancini', client: 'Simone Ferraro', branch: 'Nola', serviceType: 'Polizza famiglia / PMI', submittedOn: '2025-04-03', status: 'Under Review', reviewedBy: 'Elena Esposito' },
  { id: 'RPT-007', agent: 'Teresa Chiarello', client: 'Giovanni Rinaldi', branch: 'Nola', serviceType: 'Bundle mobile 5G', submittedOn: '2025-04-02', status: 'Submitted' },
  { id: 'RPT-008', agent: 'Lucia Mancini', client: 'Alessia Romano', branch: 'Nola', serviceType: 'Preventivo mutuo prima casa', submittedOn: '2025-04-01', status: 'Accepted', reviewedBy: 'Elena Esposito' },
  { id: 'RPT-009', agent: 'Tiziana De Pasquale', client: 'Francesco De Luca', branch: 'Catania', serviceType: 'Pratica malasanità', submittedOn: '2025-03-31', status: 'Under Review' },
  { id: 'RPT-010', agent: 'Teresa Chiarello', client: 'Alessia Romano', branch: 'Nola', serviceType: 'NLT veicolo commerciale', submittedOn: '2025-03-30', status: 'Rejected', reviewedBy: 'Elena Esposito', rejectionReason: 'IBAN aziendale non validato' },
  { id: 'RPT-011', agent: 'Angelo Ioime', client: 'Antonino Cassone', branch: 'Napoli', serviceType: 'Consulenza cessione del quinto', submittedOn: '2025-03-29', status: 'Submitted' },
  { id: 'RPT-012', agent: 'Lucia Mancini', client: 'Martina Greco', branch: 'Nola', serviceType: 'Voltura luce', submittedOn: '2025-03-28', status: 'Accepted', reviewedBy: 'Elena Esposito' },
]

const defaultCommissions: DemoCommission[] = [
  { id: 'COMM-001', agent: 'Teresa Chiarello', branch: 'Nola', deal: 'Autofficina Vesuvio', service: 'Luce', gross: 480, rate: 5, amount: 24, date: '2025-04-10', status: 'Paid' },
  { id: 'COMM-002', agent: 'Lucia Mancini', branch: 'Nola', deal: 'Panificio Nola Centro', service: 'Gas', gross: 620, rate: 5, amount: 31, date: '2025-04-08', status: 'Paid' },
  { id: 'COMM-003', agent: 'Tiziana De Pasquale', branch: 'Catania', deal: 'Studio Legale Catania Centro', service: 'Malasanità', gross: 5500, rate: 12, amount: 660, date: '2025-04-05', status: 'Approved' },
  { id: 'COMM-004', agent: 'Teresa Chiarello', branch: 'Nola', deal: 'Panificio Gragnano', service: 'Luce', gross: 1600, rate: 5, amount: 80, date: '2025-04-01', status: 'Pending' },
  { id: 'COMM-007', agent: 'Lucia Mancini', branch: 'Nola', deal: 'Contratto marzo PMI', service: 'Assicurazioni', gross: 2000, rate: 15, amount: 300, date: '2025-03-08', status: 'Disputed' },
  { id: 'COMM-008', agent: 'Attilio Rossi', branch: 'Tropea', deal: 'Agriturismo Tropea Sud', service: 'Mobile', gross: 240, rate: 5, amount: 12, date: '2025-03-01', status: 'Pending' },
  { id: 'COMM-009', agent: 'Tiziana De Pasquale', branch: 'Catania', deal: 'Digitale Sicilia Lab', service: 'Fibra', gross: 980, rate: 6, amount: 59, date: '2025-04-12', status: 'Approved' },
  { id: 'COMM-010', agent: 'Teresa Chiarello', branch: 'Nola', deal: 'GDO Campana SRL', service: 'Luce', gross: 890, rate: 5, amount: 45, date: '2025-04-11', status: 'Pending' },
  { id: 'COMM-011', agent: 'Fabio Rizzato', branch: 'Avetrana', deal: 'Servizi Energia Puglia', service: 'Gas', gross: 1750, rate: 5, amount: 88, date: '2025-04-10', status: 'Paid' },
  { id: 'COMM-012', agent: 'Lucia Mancini', branch: 'Nola', deal: 'Logistica Adriatica PMI', service: 'Assicurazioni', gross: 1400, rate: 15, amount: 210, date: '2025-04-09', status: 'Paid' },
  { id: 'COMM-013', agent: 'Teresa Chiarello', branch: 'Nola', deal: 'Abbigliamento Moda Verona', service: 'Luce', gross: 210, rate: 5, amount: 11, date: '2025-04-07', status: 'Disputed' },
  { id: 'COMM-014', agent: 'Tiziana De Pasquale', branch: 'Catania', deal: 'Cantine Etna Società', service: 'Fibra', gross: 420, rate: 6, amount: 25, date: '2025-04-06', status: 'Pending' },
  { id: 'COMM-015', agent: 'Luigi Bergamo', branch: 'Verona', deal: 'Gommista Verona Nord', service: 'NLT', gross: 28000, rate: 8, amount: 2240, date: '2025-04-04', status: 'Approved' },
]

const defaultNotifications: DemoNotification[] = [
  { id: 'n-1', audienceRole: 'employee', audienceName: 'Teresa Chiarello', type: 'commission', text: 'COMM-004 di €80 in attesa approvazione admin', read: false, createdAt: '2h ago' },
  { id: 'n-2', audienceRole: 'employee', audienceName: 'Teresa Chiarello', type: 'report', text: 'RPT-003 respinta: documenti precedente inquilino mancanti', read: false, createdAt: '1 day ago' },
  { id: 'n-3', audienceRole: 'employee', audienceName: 'Teresa Chiarello', type: 'alert', text: 'Cliente Giovanni Rinaldi: consenso trattamento ARERA in scadenza tra 31 giorni', read: true, createdAt: '4 days ago' },
  { id: 'n-8', audienceRole: 'employee', audienceName: 'Teresa Chiarello', type: 'report', text: 'RPT-007 accettata da Elena Esposito', read: false, createdAt: '35m ago' },
  { id: 'n-9', audienceRole: 'employee', audienceName: 'Teresa Chiarello', type: 'system', text: 'Nuovo modulo voltura Enel disponibile in documentazione interna', read: true, createdAt: '6h ago' },
  { id: 'n-10', audienceRole: 'employee', audienceName: 'Teresa Chiarello', type: 'alert', text: 'Pratica POD di Sofia Bianchi: verifica entro 12 giorni', read: false, createdAt: '8h ago' },
  { id: 'n-11', audienceRole: 'employee', audienceName: 'Teresa Chiarello', type: 'commission', text: 'COMM-010 calcolata: €45 in attesa approvazione', read: false, createdAt: '1 day ago' },
  { id: 'n-4', audienceRole: 'manager', audienceName: 'Elena Esposito', type: 'report', text: 'Teresa Chiarello ha inviato RPT-001 in revisione', read: false, createdAt: '2h ago' },
  { id: 'n-5', audienceRole: 'manager', audienceName: 'Elena Esposito', type: 'report', text: 'Lucia Mancini: 1 pratica in revisione', read: true, createdAt: '1 day ago' },
  { id: 'n-12', audienceRole: 'manager', audienceName: 'Elena Esposito', type: 'report', text: 'RPT-010 respinta: IBAN non validato', read: false, createdAt: '50m ago' },
  { id: 'n-13', audienceRole: 'manager', audienceName: 'Elena Esposito', type: 'alert', text: '7 lead sede Nola fermi da oltre 14 giorni', read: false, createdAt: '3h ago' },
  { id: 'n-14', audienceRole: 'manager', audienceName: 'Elena Esposito', type: 'system', text: 'Meeting performance filiale Nola domani 09:30', read: true, createdAt: '5h ago' },
  { id: 'n-15', audienceRole: 'manager', audienceName: 'Elena Esposito', type: 'commission', text: 'COMM-012 pronta per revisione finale admin', read: false, createdAt: '1 day ago' },
  { id: 'n-6', audienceRole: 'admin', audienceName: 'Santo Vanzanella', type: 'sync', text: 'Sync fornitori fallito alle 09:00 — verifica connettore Enel', read: false, createdAt: '5h ago' },
  { id: 'n-7', audienceRole: 'admin', audienceName: 'Santo Vanzanella', type: 'alert', text: 'Cliente Roberto Fabbri: morosità segnalata — revisione pratica', read: false, createdAt: '1h ago' },
  { id: 'n-16', audienceRole: 'admin', audienceName: 'Santo Vanzanella', type: 'commission', text: '5 provvigioni Pending richiedono approvazione', read: false, createdAt: '20m ago' },
  { id: 'n-17', audienceRole: 'admin', audienceName: 'Santo Vanzanella', type: 'sync', text: 'Sync fornitori OK: 28 contratti importati, 4 conflitti da risolvere', read: true, createdAt: '7h ago' },
  { id: 'n-18', audienceRole: 'admin', audienceName: 'Santo Vanzanella', type: 'system', text: 'Backup giornaliero HQ completato', read: true, createdAt: '9h ago' },
  { id: 'n-19', audienceRole: 'admin', audienceName: 'Santo Vanzanella', type: 'alert', text: 'Filiali Sud: conversione pipeline sotto target questa settimana', read: false, createdAt: '11h ago' },
  { id: 'n-20', audienceRole: 'admin', audienceName: 'Santo Vanzanella', type: 'report', text: 'RPT-011 in attesa assegnazione revisore', read: false, createdAt: '1 day ago' },
]

const defaultActivity: DemoActivity[] = [
  { id: 'a-1', agent: 'Teresa Chiarello', branch: 'Nola', text: 'Edilizia Flegrea spostata in Negotiation', kind: 'stage', createdAt: '1h ago' },
  { id: 'a-2', agent: 'Santo Vanzanella', branch: 'All', text: 'Creato partner Centro Multiservizi Duomo', kind: 'create', createdAt: '3h ago' },
  { id: 'a-3', agent: 'Lucia Mancini', branch: 'Nola', text: 'Inviata RPT-006 in revisione', kind: 'update', createdAt: '5h ago' },
  { id: 'a-4', agent: 'Teresa Chiarello', branch: 'Nola', text: 'Calcolo provvigioni batch Nola completato', kind: 'update', createdAt: 'Yesterday' },
  { id: 'a-5', agent: 'System', branch: 'All', text: 'Sync fornitori: 12 pratiche importate da portale TIM', kind: 'update', createdAt: 'Yesterday' },
  { id: 'a-6', agent: 'Teresa Chiarello', branch: 'Nola', text: 'Autofficina Vesuvio segnata Won', kind: 'stage', createdAt: '2 days ago' },
]

function seed<T>(key: string, defaults: T) {
  if (typeof window === 'undefined') return
  if (!window.localStorage.getItem(key)) {
    window.localStorage.setItem(key, JSON.stringify(defaults))
  }
}

function read<T>(key: string): T[] {
  if (typeof window === 'undefined') return [] as T[]
  const raw = window.localStorage.getItem(key)
  if (!raw) return [] as T[]

  try {
    return JSON.parse(raw) as T[]
  } catch {
    return [] as T[]
  }
}

export function seedAllRoleData() {
  seed(LEADS_KEY, defaultLeads)
  seed(REPORTS_KEY, defaultReports)
  seed(COMMISSIONS_KEY, defaultCommissions)
  seed(NOTIFICATIONS_KEY, defaultNotifications)
  seed(ACTIVITY_KEY, defaultActivity)
}

export function resetAllRoleData() {
  if (typeof window === 'undefined') return
  ;[LEADS_KEY, REPORTS_KEY, COMMISSIONS_KEY, NOTIFICATIONS_KEY, ACTIVITY_KEY].forEach((key) => {
    window.localStorage.removeItem(key)
  })
  seedAllRoleData()
}

function scopeRecords<T extends { branch?: string; assignedAgent?: string; agent?: string }>(records: T[]): T[] {
  const user = getSessionUser()
  if (!user) return []
  if (user.role === 'admin') return records
  if (user.role === 'manager') return records.filter((item) => item.branch === MANAGER_SCOPE_BRANCH)
  return records.filter((item) => item.assignedAgent === user.name || item.agent === user.name)
}

export function getLeads(): DemoLead[] {
  seedAllRoleData()
  return scopeRecords(read<DemoLead>(LEADS_KEY))
}

export function getAllLeads(): DemoLead[] {
  seedAllRoleData()
  return read<DemoLead>(LEADS_KEY)
}

export function saveLeads(next: DemoLead[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LEADS_KEY, JSON.stringify(next))
}

export function createLead(input: Omit<DemoLead, 'id'>): DemoLead {
  const item: DemoLead = {
    ...input,
    id: `lead-${Date.now()}`,
  }
  const all = getAllLeads()
  saveLeads([item, ...all])
  return item
}

export function updateLead(id: string, patch: Partial<Omit<DemoLead, 'id'>>) {
  const all = getAllLeads()
  saveLeads(all.map((item) => (item.id === id ? { ...item, ...patch } : item)))
}

export function deleteLead(id: string) {
  const all = getAllLeads()
  saveLeads(all.filter((item) => item.id !== id))
}

export function getReports(): DemoReport[] {
  seedAllRoleData()
  return scopeRecords(read<DemoReport>(REPORTS_KEY))
}

export function getAllReports(): DemoReport[] {
  seedAllRoleData()
  return read<DemoReport>(REPORTS_KEY)
}

export function saveReports(next: DemoReport[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(REPORTS_KEY, JSON.stringify(next))
}

export function createReport(input: Omit<DemoReport, 'id'>): DemoReport {
  const row: DemoReport = {
    ...input,
    id: `RPT-${Date.now()}`,
  }
  saveReports([row, ...getAllReports()])
  return row
}

export function updateReport(id: string, patch: Partial<Omit<DemoReport, 'id'>>) {
  const next = getAllReports().map((item) => (item.id === id ? { ...item, ...patch } : item))
  saveReports(next)
}

export function deleteReport(id: string) {
  const next = getAllReports().filter((item) => item.id !== id)
  saveReports(next)
}

export function getCommissions(): DemoCommission[] {
  seedAllRoleData()
  return scopeRecords(read<DemoCommission>(COMMISSIONS_KEY))
}

export function getActivity(): DemoActivity[] {
  seedAllRoleData()
  return scopeRecords(read<DemoActivity>(ACTIVITY_KEY))
}

export function getNotifications(): DemoNotification[] {
  seedAllRoleData()
  const user = getSessionUser()
  const all = read<DemoNotification>(NOTIFICATIONS_KEY)
  if (!user) return []
  return all.filter((item) => item.audienceRole === user.role && (!item.audienceName || item.audienceName === user.name))
}
