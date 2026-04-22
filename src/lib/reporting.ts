import { getSessionUser } from './demoAuth'
import { seedFinance } from './finance'
import { getAllLeads, seedAllRoleData } from './seed'
import { storeRead, storeSeedIfMissing, storeWrite } from './store'
import { getBranches } from './orgData'
import type { DemoCommission } from './seed'
import type { LedgerEntry } from './finance'
import { getCashFlowByMonth } from './finance'

const SAVED_VIEWS_KEY = 'ems_saved_reports'

export type ReportPresetId =
  | 'pipeline-performance'
  | 'commission-report'
  | 'cash-flow'
  | 'agent-productivity'
  | 'branch-performance'

export type ReportFilters = {
  branch?: string
  agent?: string
  period?: string
}

export type SavedView = {
  id: string
  name: string
  preset: ReportPresetId
  filters: ReportFilters
  createdAt: string
}

export type ReportRow = Record<string, string | number>
export type ChartSeries = { label: string; value: number }

export type ReportResult = {
  rows: ReportRow[]
  chart: ChartSeries[]
  summary: { label: string; value: string }[]
}

function scopeBranch(filters: ReportFilters): string | undefined {
  const user = getSessionUser()
  if (user?.role === 'manager') return user.branch
  return filters.branch && filters.branch !== 'All' ? filters.branch : undefined
}

function scopeAgent(filters: ReportFilters): string | undefined {
  const user = getSessionUser()
  if (user?.role === 'employee') return user.name
  return filters.agent && filters.agent !== 'All' ? filters.agent : undefined
}

export function runReport(preset: ReportPresetId, filters: ReportFilters): ReportResult {
  seedAllRoleData()
  seedFinance()
  switch (preset) {
    case 'pipeline-performance':
      return pipelinePerformance(filters)
    case 'commission-report':
      return commissionReport(filters)
    case 'cash-flow':
      return cashFlowReport()
    case 'agent-productivity':
      return agentProductivity(filters)
    case 'branch-performance':
      return branchPerformance()
  }
}

function pipelinePerformance(filters: ReportFilters): ReportResult {
  const branch = scopeBranch(filters)
  const agent = scopeAgent(filters)
  let leads = getAllLeads()
  if (branch) leads = leads.filter((l) => l.branch === branch)
  if (agent) leads = leads.filter((l) => l.assignedAgent === agent)

  const stages = ['New', 'Contacted', 'Proposal Sent', 'Negotiation', 'Won', 'Lost']
  const chart: ChartSeries[] = stages.map((s) => ({
    label: s,
    value: leads.filter((l) => l.stage === s).length,
  }))
  const wonValue = leads.filter((l) => l.stage === 'Won').reduce((sum, l) => sum + (l.contractValue ?? 0), 0)
  const totalLeads = leads.length
  const wonCount = leads.filter((l) => l.stage === 'Won').length
  const conversion = totalLeads > 0 ? (wonCount / totalLeads) * 100 : 0

  const rows: ReportRow[] = leads.map((l) => ({
    id: l.id,
    company: l.company,
    agent: l.assignedAgent,
    branch: l.branch,
    stage: l.stage,
    service: l.serviceType,
    value: l.contractValue ?? 0,
  }))

  return {
    rows,
    chart,
    summary: [
      { label: 'Total Leads', value: String(totalLeads) },
      { label: 'Won', value: String(wonCount) },
      { label: 'Won Revenue', value: `€${wonValue.toLocaleString()}` },
      { label: 'Conversion', value: `${conversion.toFixed(1)}%` },
    ],
  }
}

function commissionReport(filters: ReportFilters): ReportResult {
  const branch = scopeBranch(filters)
  const agent = scopeAgent(filters)
  let commissions = storeRead<DemoCommission[]>('ems_commissions', [])
  if (branch) commissions = commissions.filter((c) => c.branch === branch)
  if (agent) commissions = commissions.filter((c) => c.agent === agent)

  const statuses = ['Pending', 'Approved', 'Paid', 'Disputed']
  const chart: ChartSeries[] = statuses.map((s) => ({
    label: s,
    value: commissions.filter((c) => c.status === s).reduce((sum, c) => sum + c.amount, 0),
  }))

  const total = commissions.reduce((sum, c) => sum + c.amount, 0)
  const rows: ReportRow[] = commissions.map((c) => ({
    id: c.id,
    agent: c.agent,
    branch: c.branch,
    deal: c.deal,
    service: c.service,
    rate: `${c.rate}%`,
    amount: c.amount,
    status: c.status,
    date: c.date,
  }))

  return {
    rows,
    chart,
    summary: [
      { label: 'Records', value: String(commissions.length) },
      { label: 'Total', value: `€${total.toLocaleString()}` },
      { label: 'Paid', value: `€${commissions.filter((c) => c.status === 'Paid').reduce((s, c) => s + c.amount, 0).toLocaleString()}` },
      { label: 'Pending', value: `€${commissions.filter((c) => c.status === 'Pending').reduce((s, c) => s + c.amount, 0).toLocaleString()}` },
    ],
  }
}

function cashFlowReport(): ReportResult {
  const cashflow = getCashFlowByMonth()
  const chart: ChartSeries[] = cashflow.map((c) => ({ label: c.month, value: c.net }))
  const rows: ReportRow[] = cashflow.map((c) => ({
    month: c.month,
    income: c.income,
    expense: c.expense,
    net: c.net,
  }))
  const totalIncome = cashflow.reduce((s, c) => s + c.income, 0)
  const totalExpense = cashflow.reduce((s, c) => s + c.expense, 0)

  return {
    rows,
    chart,
    summary: [
      { label: 'Income', value: `€${totalIncome.toLocaleString()}` },
      { label: 'Expense', value: `€${totalExpense.toLocaleString()}` },
      { label: 'Net', value: `€${(totalIncome - totalExpense).toLocaleString()}` },
      { label: 'Months', value: String(cashflow.length) },
    ],
  }
}

function agentProductivity(filters: ReportFilters): ReportResult {
  const branch = scopeBranch(filters)
  const agent = scopeAgent(filters)
  let leads = getAllLeads()
  if (branch) leads = leads.filter((l) => l.branch === branch)
  if (agent) leads = leads.filter((l) => l.assignedAgent === agent)

  const byAgent = new Map<string, { total: number; won: number; revenue: number }>()
  leads.forEach((l) => {
    const current = byAgent.get(l.assignedAgent) ?? { total: 0, won: 0, revenue: 0 }
    current.total += 1
    if (l.stage === 'Won') {
      current.won += 1
      current.revenue += l.contractValue ?? 0
    }
    byAgent.set(l.assignedAgent, current)
  })

  const rows: ReportRow[] = Array.from(byAgent.entries()).map(([name, v]) => ({
    agent: name,
    totalLeads: v.total,
    wonLeads: v.won,
    conversion: `${v.total ? ((v.won / v.total) * 100).toFixed(1) : 0}%`,
    revenue: v.revenue,
  }))
  const chart: ChartSeries[] = rows.map((r) => ({ label: String(r.agent), value: Number(r.revenue) }))

  return {
    rows,
    chart,
    summary: [
      { label: 'Agents', value: String(rows.length) },
      { label: 'Total Leads', value: String(leads.length) },
      { label: 'Won', value: String(leads.filter((l) => l.stage === 'Won').length) },
    ],
  }
}

function branchPerformance(): ReportResult {
  const branches = getBranches()
  const leads = getAllLeads()
  const rows: ReportRow[] = branches.map((b) => {
    const branchLeads = leads.filter((l) => l.branch === b.name)
    const won = branchLeads.filter((l) => l.stage === 'Won')
    const revenue = won.reduce((s, l) => s + (l.contractValue ?? 0), 0)
    return {
      branch: b.name,
      city: b.city,
      manager: b.manager,
      totalLeads: branchLeads.length,
      wonLeads: won.length,
      revenue,
      conversion: `${branchLeads.length ? ((won.length / branchLeads.length) * 100).toFixed(1) : 0}%`,
    }
  })
  const chart: ChartSeries[] = rows.map((r) => ({ label: String(r.branch), value: Number(r.revenue) }))
  return {
    rows,
    chart,
    summary: [
      { label: 'Branches', value: String(branches.length) },
      { label: 'Total Leads', value: String(leads.length) },
      { label: 'Total Revenue', value: `€${rows.reduce((s, r) => s + Number(r.revenue), 0).toLocaleString()}` },
    ],
  }
}

export function getSavedViews(): SavedView[] {
  storeSeedIfMissing(SAVED_VIEWS_KEY, [] as SavedView[])
  return storeRead<SavedView[]>(SAVED_VIEWS_KEY, [])
}

export function saveView(view: Omit<SavedView, 'id' | 'createdAt'>): SavedView {
  const row: SavedView = {
    ...view,
    id: `sv-${Date.now()}`,
    createdAt: new Date().toISOString().slice(0, 10),
  }
  storeWrite(SAVED_VIEWS_KEY, [row, ...getSavedViews()])
  return row
}

export function deleteSavedView(id: string) {
  storeWrite(SAVED_VIEWS_KEY, getSavedViews().filter((v) => v.id !== id))
}

export function resetReporting() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(SAVED_VIEWS_KEY)
}

export const PRESET_LABELS: Record<ReportPresetId, string> = {
  'pipeline-performance': 'Pipeline Performance',
  'commission-report': 'Commission Report',
  'cash-flow': 'Cash Flow',
  'agent-productivity': 'Agent Productivity',
  'branch-performance': 'Branch Performance',
}

// Keep a default import to satisfy type dependency usage
export type { LedgerEntry }
