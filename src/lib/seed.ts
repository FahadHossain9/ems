import { getSessionUser } from './demoAuth'

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
  { id: 'lead-001', company: 'TechSol Verona', assignedAgent: 'Marco Rossi', branch: 'Branch Nord', stage: 'New', serviceType: 'immigration', contractValue: null, stageAgeDays: 2 },
  { id: 'lead-002', company: 'Farmacia Centrale', assignedAgent: 'Lucia Mancini', branch: 'Branch Nord', stage: 'Contacted', serviceType: 'tax', contractValue: 40, stageAgeDays: 22 },
  { id: 'lead-003', company: 'Autoricambi Torino', assignedAgent: 'Paolo Conti', branch: 'Branch Sud', stage: 'New', serviceType: 'legal', contractValue: null, stageAgeDays: 31 },
  { id: 'lead-004', company: 'Costruzioni Bianchi', assignedAgent: 'Marco Rossi', branch: 'Branch Nord', stage: 'Contacted', serviceType: 'immigration', contractValue: 80, stageAgeDays: 5 },
  { id: 'lead-005', company: 'Studio Commerciale Brescia', assignedAgent: 'Lucia Mancini', branch: 'Branch Nord', stage: 'Contacted', serviceType: 'tax', contractValue: 40, stageAgeDays: 12 },
  { id: 'lead-006', company: 'Studio Legale Bari', assignedAgent: 'Marco Rossi', branch: 'Branch Nord', stage: 'Proposal Sent', serviceType: 'legal', contractValue: 200, stageAgeDays: 18 },
  { id: 'lead-007', company: 'Edilizia Lombarda', assignedAgent: 'Marco Rossi', branch: 'Branch Nord', stage: 'Negotiation', serviceType: 'immigration', contractValue: 160, stageAgeDays: 3 },
  { id: 'lead-008', company: 'Moda Italia Boutique', assignedAgent: 'Paolo Conti', branch: 'Branch Sud', stage: 'Negotiation', serviceType: 'tax', contractValue: 80, stageAgeDays: 9 },
  { id: 'lead-009', company: 'Informatica Veneta', assignedAgent: 'Marco Rossi', branch: 'Branch Nord', stage: 'Won', serviceType: 'tax', contractValue: 400, stageAgeDays: 4 },
  { id: 'lead-010', company: 'Logistica Padana', assignedAgent: 'Lucia Mancini', branch: 'Branch Nord', stage: 'Won', serviceType: 'immigration', contractValue: 800, stageAgeDays: 6 },
  { id: 'lead-011', company: 'Ceramiche del Sud', assignedAgent: 'Paolo Conti', branch: 'Branch Sud', stage: 'Won', serviceType: 'legal', contractValue: 2000, stageAgeDays: 9 },
  { id: 'lead-012', company: 'Import Export Milano', assignedAgent: 'Marco Rossi', branch: 'Branch Nord', stage: 'Lost', serviceType: 'immigration', contractValue: null, stageAgeDays: 14 },
  { id: 'lead-013', company: 'Officina Napoli Centro', assignedAgent: 'Paolo Conti', branch: 'Branch Sud', stage: 'New', serviceType: 'legal', contractValue: 120, stageAgeDays: 1 },
  { id: 'lead-014', company: 'Ristorante Venezia Uno', assignedAgent: 'Lucia Mancini', branch: 'Branch Nord', stage: 'Contacted', serviceType: 'tax', contractValue: 90, stageAgeDays: 8 },
  { id: 'lead-015', company: 'Cantina Siciliana Group', assignedAgent: 'Paolo Conti', branch: 'Branch Sud', stage: 'Proposal Sent', serviceType: 'immigration', contractValue: 320, stageAgeDays: 16 },
  { id: 'lead-016', company: 'Studio Moda Firenze', assignedAgent: 'Marco Rossi', branch: 'Branch Nord', stage: 'Negotiation', serviceType: 'tax', contractValue: 210, stageAgeDays: 6 },
  { id: 'lead-017', company: 'Logistica Adriatica', assignedAgent: 'Lucia Mancini', branch: 'Branch Nord', stage: 'Won', serviceType: 'legal', contractValue: 1400, stageAgeDays: 2 },
  { id: 'lead-018', company: 'GDO Parma Retail', assignedAgent: 'Marco Rossi', branch: 'Branch Nord', stage: 'Proposal Sent', serviceType: 'immigration', contractValue: 450, stageAgeDays: 12 },
  { id: 'lead-019', company: 'Alberghi Toscani SPA', assignedAgent: 'Paolo Conti', branch: 'Branch Sud', stage: 'Contacted', serviceType: 'tax', contractValue: 180, stageAgeDays: 21 },
  { id: 'lead-020', company: 'Servizi Energia Puglia', assignedAgent: 'Paolo Conti', branch: 'Branch Sud', stage: 'Won', serviceType: 'legal', contractValue: 1750, stageAgeDays: 5 },
  { id: 'lead-021', company: 'Farmacie Emilia Network', assignedAgent: 'Lucia Mancini', branch: 'Branch Nord', stage: 'Negotiation', serviceType: 'immigration', contractValue: 530, stageAgeDays: 11 },
  { id: 'lead-022', company: 'Autonoleggi Torino Hub', assignedAgent: 'Marco Rossi', branch: 'Branch Nord', stage: 'New', serviceType: 'tax', contractValue: 70, stageAgeDays: 4 },
  { id: 'lead-023', company: 'Marittima Salerno SRL', assignedAgent: 'Paolo Conti', branch: 'Branch Sud', stage: 'Lost', serviceType: 'legal', contractValue: null, stageAgeDays: 19 },
  { id: 'lead-024', company: 'Digitale Trentino Lab', assignedAgent: 'Lucia Mancini', branch: 'Branch Nord', stage: 'Won', serviceType: 'tax', contractValue: 980, stageAgeDays: 3 },
]

const defaultReports: DemoReport[] = [
  { id: 'RPT-001', agent: 'Marco Rossi', client: 'Ahmed Al-Rashid', branch: 'Branch Nord', serviceType: 'Immigration Renewal', submittedOn: '2025-04-10', status: 'Submitted' },
  { id: 'RPT-002', agent: 'Lucia Mancini', client: 'Elena Popescu', branch: 'Branch Nord', serviceType: 'CAF Tax Return', submittedOn: '2025-04-09', status: 'Accepted', reviewedBy: 'Roberto Marino' },
  { id: 'RPT-003', agent: 'Marco Rossi', client: 'Dong Wei', branch: 'Branch Nord', serviceType: 'Work Permit', submittedOn: '2025-04-08', status: 'Rejected', reviewedBy: 'Roberto Marino', rejectionReason: 'Missing employer letter' },
  { id: 'RPT-004', agent: 'Paolo Conti', client: 'Amira Ben Salah', branch: 'Branch Sud', serviceType: 'Family Reunion', submittedOn: '2025-04-07', status: 'Submitted' },
  { id: 'RPT-005', agent: 'Marco Rossi', client: 'Priya Sharma', branch: 'Branch Nord', serviceType: 'Immigration Renewal', submittedOn: '2025-04-05', status: 'Accepted', reviewedBy: 'Roberto Marino' },
  { id: 'RPT-006', agent: 'Lucia Mancini', client: 'Yusuf Adeyemi', branch: 'Branch Nord', serviceType: 'Work Permit', submittedOn: '2025-04-03', status: 'Under Review', reviewedBy: 'Roberto Marino' },
  { id: 'RPT-007', agent: 'Marco Rossi', client: 'Giovanni Rinaldi', branch: 'Branch Nord', serviceType: 'CAF Tax Return', submittedOn: '2025-04-02', status: 'Submitted' },
  { id: 'RPT-008', agent: 'Lucia Mancini', client: 'Sofia Bianchi', branch: 'Branch Nord', serviceType: 'Immigration Renewal', submittedOn: '2025-04-01', status: 'Accepted', reviewedBy: 'Roberto Marino' },
  { id: 'RPT-009', agent: 'Paolo Conti', client: 'Luca Esposito', branch: 'Branch Sud', serviceType: 'Family Reunion', submittedOn: '2025-03-31', status: 'Under Review' },
  { id: 'RPT-010', agent: 'Marco Rossi', client: 'Alessia Romano', branch: 'Branch Nord', serviceType: 'Work Permit', submittedOn: '2025-03-30', status: 'Rejected', reviewedBy: 'Roberto Marino', rejectionReason: 'Documento identita non leggibile' },
  { id: 'RPT-011', agent: 'Paolo Conti', client: 'Francesco De Luca', branch: 'Branch Sud', serviceType: 'Immigration Renewal', submittedOn: '2025-03-29', status: 'Submitted' },
  { id: 'RPT-012', agent: 'Lucia Mancini', client: 'Martina Greco', branch: 'Branch Nord', serviceType: 'CAF Tax Return', submittedOn: '2025-03-28', status: 'Accepted', reviewedBy: 'Roberto Marino' },
]

const defaultCommissions: DemoCommission[] = [
  { id: 'COMM-001', agent: 'Marco Rossi', branch: 'Branch Nord', deal: 'Informatica Veneta', service: 'Tax', gross: 400, rate: 10, amount: 40, date: '2025-04-10', status: 'Paid' },
  { id: 'COMM-002', agent: 'Lucia Mancini', branch: 'Branch Nord', deal: 'Logistica Padana', service: 'Immigration', gross: 800, rate: 10, amount: 80, date: '2025-04-08', status: 'Paid' },
  { id: 'COMM-003', agent: 'Paolo Conti', branch: 'Branch Sud', deal: 'Ceramiche del Sud', service: 'Legal', gross: 2000, rate: 10, amount: 200, date: '2025-04-05', status: 'Approved' },
  { id: 'COMM-004', agent: 'Marco Rossi', branch: 'Branch Nord', deal: 'Edilizia Lombarda', service: 'Immigration', gross: 1600, rate: 10, amount: 160, date: '2025-04-01', status: 'Pending' },
  { id: 'COMM-007', agent: 'Marco Rossi', branch: 'Branch Nord', deal: 'March deal', service: 'Legal', gross: 2000, rate: 10, amount: 200, date: '2025-03-08', status: 'Disputed' },
  { id: 'COMM-008', agent: 'Paolo Conti', branch: 'Branch Sud', deal: 'March deal', service: 'Tax', gross: 400, rate: 10, amount: 40, date: '2025-03-01', status: 'Pending' },
  { id: 'COMM-009', agent: 'Lucia Mancini', branch: 'Branch Nord', deal: 'Digitale Trentino Lab', service: 'Tax', gross: 980, rate: 10, amount: 98, date: '2025-04-12', status: 'Approved' },
  { id: 'COMM-010', agent: 'Marco Rossi', branch: 'Branch Nord', deal: 'GDO Parma Retail', service: 'Immigration', gross: 450, rate: 10, amount: 45, date: '2025-04-11', status: 'Pending' },
  { id: 'COMM-011', agent: 'Paolo Conti', branch: 'Branch Sud', deal: 'Servizi Energia Puglia', service: 'Legal', gross: 1750, rate: 10, amount: 175, date: '2025-04-10', status: 'Paid' },
  { id: 'COMM-012', agent: 'Lucia Mancini', branch: 'Branch Nord', deal: 'Logistica Adriatica', service: 'Legal', gross: 1400, rate: 10, amount: 140, date: '2025-04-09', status: 'Paid' },
  { id: 'COMM-013', agent: 'Marco Rossi', branch: 'Branch Nord', deal: 'Studio Moda Firenze', service: 'Tax', gross: 210, rate: 10, amount: 21, date: '2025-04-07', status: 'Disputed' },
  { id: 'COMM-014', agent: 'Paolo Conti', branch: 'Branch Sud', deal: 'Cantina Siciliana Group', service: 'Immigration', gross: 320, rate: 10, amount: 32, date: '2025-04-06', status: 'Pending' },
]

const defaultNotifications: DemoNotification[] = [
  { id: 'n-1', audienceRole: 'employee', audienceName: 'Marco Rossi', type: 'commission', text: 'COMM-004 of €160 pending approval', read: false, createdAt: '2h ago' },
  { id: 'n-2', audienceRole: 'employee', audienceName: 'Marco Rossi', type: 'report', text: 'RPT-003 rejected: Missing employer letter', read: false, createdAt: '1 day ago' },
  { id: 'n-3', audienceRole: 'employee', audienceName: 'Marco Rossi', type: 'alert', text: 'Ahmed Al-Rashid permit expires in 31 days', read: true, createdAt: '4 days ago' },
  { id: 'n-8', audienceRole: 'employee', audienceName: 'Marco Rossi', type: 'report', text: 'RPT-007 accepted by Roberto Marino', read: false, createdAt: '35m ago' },
  { id: 'n-9', audienceRole: 'employee', audienceName: 'Marco Rossi', type: 'system', text: 'Nuovo template CAF disponibile per la tua filiale', read: true, createdAt: '6h ago' },
  { id: 'n-10', audienceRole: 'employee', audienceName: 'Marco Rossi', type: 'alert', text: 'Pratica di Sofia Bianchi in scadenza tra 12 giorni', read: false, createdAt: '8h ago' },
  { id: 'n-11', audienceRole: 'employee', audienceName: 'Marco Rossi', type: 'commission', text: 'COMM-010 calcolata: €45 in attesa approvazione', read: false, createdAt: '1 day ago' },
  { id: 'n-4', audienceRole: 'manager', audienceName: 'Roberto Marino', type: 'report', text: 'Marco Rossi submitted RPT-001 for review', read: false, createdAt: '2h ago' },
  { id: 'n-5', audienceRole: 'manager', audienceName: 'Roberto Marino', type: 'report', text: 'Lucia Mancini has 1 report under review', read: true, createdAt: '1 day ago' },
  { id: 'n-12', audienceRole: 'manager', audienceName: 'Roberto Marino', type: 'report', text: 'RPT-010 respinta: documento identita non leggibile', read: false, createdAt: '50m ago' },
  { id: 'n-13', audienceRole: 'manager', audienceName: 'Roberto Marino', type: 'alert', text: '7 lead in Branch Nord fermi da oltre 14 giorni', read: false, createdAt: '3h ago' },
  { id: 'n-14', audienceRole: 'manager', audienceName: 'Roberto Marino', type: 'system', text: 'Meeting performance filiale Nord fissato per domani 09:30', read: true, createdAt: '5h ago' },
  { id: 'n-15', audienceRole: 'manager', audienceName: 'Roberto Marino', type: 'commission', text: 'COMM-009 pronta per revisione finale admin', read: false, createdAt: '1 day ago' },
  { id: 'n-6', audienceRole: 'admin', audienceName: 'Giulia Ferretti', type: 'sync', text: 'SOS sync failed at 09:00. Manual check needed.', read: false, createdAt: '5h ago' },
  { id: 'n-7', audienceRole: 'admin', audienceName: 'Giulia Ferretti', type: 'alert', text: 'Hassan Okafor: permit expires in 8 days', read: false, createdAt: '1h ago' },
  { id: 'n-16', audienceRole: 'admin', audienceName: 'Giulia Ferretti', type: 'commission', text: '5 provvigioni in stato Pending richiedono approvazione', read: false, createdAt: '20m ago' },
  { id: 'n-17', audienceRole: 'admin', audienceName: 'Giulia Ferretti', type: 'sync', text: 'SOS sync completata: 28 record importati, 4 conflitti', read: true, createdAt: '7h ago' },
  { id: 'n-18', audienceRole: 'admin', audienceName: 'Giulia Ferretti', type: 'system', text: 'Backup giornaliero CRM completato correttamente', read: true, createdAt: '9h ago' },
  { id: 'n-19', audienceRole: 'admin', audienceName: 'Giulia Ferretti', type: 'alert', text: 'Branch Sud sotto target conversione pipeline questa settimana', read: false, createdAt: '11h ago' },
  { id: 'n-20', audienceRole: 'admin', audienceName: 'Giulia Ferretti', type: 'report', text: 'RPT-011 in attesa assegnazione revisore', read: false, createdAt: '1 day ago' },
]

const defaultActivity: DemoActivity[] = [
  { id: 'a-1', agent: 'Marco Rossi', branch: 'Branch Nord', text: 'Moved Costruzioni Bianchi to Negotiation', kind: 'stage', createdAt: '1h ago' },
  { id: 'a-2', agent: 'Giulia Ferretti', branch: 'All', text: 'Created partner Agenzia Napoli Sud', kind: 'create', createdAt: '3h ago' },
  { id: 'a-3', agent: 'Lucia Mancini', branch: 'Branch Nord', text: 'Submitted RPT-006 for review', kind: 'update', createdAt: '5h ago' },
  { id: 'a-4', agent: 'Marco Rossi', branch: 'Branch Nord', text: 'Commission €1,200 calculated', kind: 'update', createdAt: 'Yesterday' },
  { id: 'a-5', agent: 'System', branch: 'All', text: 'SOS sync completed — 12 records imported', kind: 'update', createdAt: 'Yesterday' },
  { id: 'a-6', agent: 'Marco Rossi', branch: 'Branch Nord', text: 'Edilizia Lombarda marked Won', kind: 'stage', createdAt: '2 days ago' },
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
  if (user.role === 'manager') return records.filter((item) => item.branch === 'Branch Nord')
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
