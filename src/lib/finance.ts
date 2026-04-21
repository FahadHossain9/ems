import { storeRead, storeSeedIfMissing, storeWrite } from './store'
import { getAllLeads } from './seed'
import type { DemoCommission } from './seed'

export type CommissionRule = {
  id: string
  service: string
  rate: number
}

export type InvoiceStatus = 'Draft' | 'Invited' | 'Acknowledged' | 'Paid'

export type Invoice = {
  id: string
  agent: string
  branch: string
  period: string
  items: string[]
  amount: number
  status: InvoiceStatus
  createdAt: string
  paidAt?: string
}

export type LedgerType = 'income' | 'expense'
export type LedgerSource = 'invoice' | 'commission' | 'manual'

export type LedgerEntry = {
  id: string
  date: string
  type: LedgerType
  category: string
  amount: number
  description: string
  source: LedgerSource
  sourceId?: string
}

const RULES_KEY = 'ems_commission_rules'
const INVOICES_KEY = 'ems_invoices'
const LEDGER_KEY = 'ems_ledger'
const COMMISSIONS_KEY = 'ems_commissions'

const defaultRules: CommissionRule[] = [
  { id: 'rule-imm', service: 'Immigration', rate: 10 },
  { id: 'rule-tax', service: 'Tax', rate: 8 },
  { id: 'rule-legal', service: 'Legal', rate: 12 },
]

const defaultInvoices: Invoice[] = [
  {
    id: 'INV-001',
    agent: 'Marco Rossi',
    branch: 'Branch Nord',
    period: '2025-03',
    items: ['COMM-001', 'COMM-013'],
    amount: 61,
    status: 'Paid',
    createdAt: '2025-04-01',
    paidAt: '2025-04-05',
  },
  {
    id: 'INV-002',
    agent: 'Lucia Mancini',
    branch: 'Branch Nord',
    period: '2025-03',
    items: ['COMM-002', 'COMM-009'],
    amount: 178,
    status: 'Acknowledged',
    createdAt: '2025-04-01',
  },
  {
    id: 'INV-003',
    agent: 'Paolo Conti',
    branch: 'Branch Sud',
    period: '2025-03',
    items: ['COMM-003', 'COMM-011'],
    amount: 375,
    status: 'Invited',
    createdAt: '2025-04-02',
  },
]

const defaultLedger: LedgerEntry[] = [
  { id: 'lg-001', date: '2025-01-15', type: 'income', category: 'Service Fee', amount: 12000, description: 'Immigration onboarding batch', source: 'manual' },
  { id: 'lg-002', date: '2025-01-28', type: 'expense', category: 'Office', amount: 2400, description: 'Rent Branch Nord', source: 'manual' },
  { id: 'lg-003', date: '2025-02-12', type: 'income', category: 'Service Fee', amount: 15800, description: 'Tax season fees', source: 'manual' },
  { id: 'lg-004', date: '2025-02-24', type: 'expense', category: 'Salaries', amount: 8200, description: 'Payroll Feb', source: 'manual' },
  { id: 'lg-005', date: '2025-03-10', type: 'income', category: 'Service Fee', amount: 19400, description: 'Legal deals', source: 'manual' },
  { id: 'lg-006', date: '2025-03-22', type: 'expense', category: 'Commission', amount: 61, description: 'INV-001 paid', source: 'invoice', sourceId: 'INV-001' },
  { id: 'lg-007', date: '2025-04-02', type: 'income', category: 'Service Fee', amount: 22100, description: 'Early April inflows', source: 'manual' },
  { id: 'lg-008', date: '2025-04-10', type: 'expense', category: 'Office', amount: 2400, description: 'Rent Branch Nord', source: 'manual' },
]

export function seedFinance() {
  storeSeedIfMissing(RULES_KEY, defaultRules)
  storeSeedIfMissing(INVOICES_KEY, defaultInvoices)
  storeSeedIfMissing(LEDGER_KEY, defaultLedger)
}

export function resetFinance() {
  if (typeof window === 'undefined') return
  ;[RULES_KEY, INVOICES_KEY, LEDGER_KEY].forEach((key) => window.localStorage.removeItem(key))
  seedFinance()
}

export function getRules(): CommissionRule[] {
  seedFinance()
  return storeRead<CommissionRule[]>(RULES_KEY, defaultRules)
}

export function saveRules(next: CommissionRule[]) {
  storeWrite(RULES_KEY, next)
}

export function getInvoices(): Invoice[] {
  seedFinance()
  return storeRead<Invoice[]>(INVOICES_KEY, defaultInvoices)
}

export function saveInvoices(next: Invoice[]) {
  storeWrite(INVOICES_KEY, next)
}

export function getLedger(): LedgerEntry[] {
  seedFinance()
  return storeRead<LedgerEntry[]>(LEDGER_KEY, defaultLedger)
}

export function saveLedger(next: LedgerEntry[]) {
  storeWrite(LEDGER_KEY, next)
}

export function addLedgerEntry(entry: Omit<LedgerEntry, 'id'>) {
  const row: LedgerEntry = { ...entry, id: `lg-${Date.now()}` }
  saveLedger([row, ...getLedger()])
  return row
}

export function deleteLedgerEntry(id: string) {
  saveLedger(getLedger().filter((e) => e.id !== id))
}

function readCommissions(): DemoCommission[] {
  return storeRead<DemoCommission[]>(COMMISSIONS_KEY, [])
}

function saveCommissions(next: DemoCommission[]) {
  storeWrite(COMMISSIONS_KEY, next)
}

export function runCommissionCalculation() {
  const rules = getRules()
  const wonLeads = getAllLeads().filter((lead) => lead.stage === 'Won' && lead.contractValue && lead.contractValue > 0)
  const existing = readCommissions()
  const existingDeals = new Set(existing.map((c) => c.deal))

  const created: DemoCommission[] = []
  wonLeads.forEach((lead) => {
    if (existingDeals.has(lead.company)) return
    const serviceKey = lead.serviceType.toLowerCase()
    const rule =
      rules.find((r) => r.service.toLowerCase() === serviceKey) ??
      rules.find((r) => serviceKey.includes(r.service.toLowerCase())) ??
      rules[0]
    if (!rule) return
    const gross = lead.contractValue as number
    const amount = Math.round((gross * rule.rate) / 100)
    created.push({
      id: `COMM-AUTO-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
      agent: lead.assignedAgent,
      branch: lead.branch,
      deal: lead.company,
      service: rule.service,
      gross,
      rate: rule.rate,
      amount,
      date: new Date().toISOString().slice(0, 10),
      status: 'Pending',
    })
  })

  if (created.length > 0) {
    saveCommissions([...created, ...existing])
  }
  return created.length
}

export function generateInvoiceForAgent(agent: string, period: string): Invoice | null {
  const commissions = readCommissions().filter(
    (c) => c.agent === agent && (c.status === 'Approved' || c.status === 'Pending'),
  )
  if (commissions.length === 0) return null
  const amount = commissions.reduce((sum, c) => sum + c.amount, 0)
  const branch = commissions[0]?.branch ?? ''
  const invoice: Invoice = {
    id: `INV-${Date.now()}`,
    agent,
    branch,
    period,
    items: commissions.map((c) => c.id),
    amount,
    status: 'Draft',
    createdAt: new Date().toISOString().slice(0, 10),
  }
  saveInvoices([invoice, ...getInvoices()])
  return invoice
}

export function updateInvoiceStatus(id: string, status: InvoiceStatus) {
  const now = new Date().toISOString().slice(0, 10)
  const updated = getInvoices().map((inv) =>
    inv.id === id ? { ...inv, status, paidAt: status === 'Paid' ? now : inv.paidAt } : inv,
  )
  saveInvoices(updated)

  if (status === 'Paid') {
    const invoice = updated.find((i) => i.id === id)
    if (invoice && !getLedger().some((l) => l.sourceId === id && l.source === 'invoice')) {
      addLedgerEntry({
        date: now,
        type: 'expense',
        category: 'Commission Payout',
        amount: invoice.amount,
        description: `Invoice ${invoice.id} paid to ${invoice.agent}`,
        source: 'invoice',
        sourceId: invoice.id,
      })
    }
  }
}

export function deleteInvoice(id: string) {
  saveInvoices(getInvoices().filter((i) => i.id !== id))
}

export function getCashFlowByMonth(): Array<{ month: string; income: number; expense: number; net: number }> {
  const ledger = getLedger()
  const map = new Map<string, { income: number; expense: number }>()
  ledger.forEach((e) => {
    const month = e.date.slice(0, 7)
    const current = map.get(month) ?? { income: 0, expense: 0 }
    if (e.type === 'income') current.income += e.amount
    else current.expense += e.amount
    map.set(month, current)
  })
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, income: v.income, expense: v.expense, net: v.income - v.expense }))
}
