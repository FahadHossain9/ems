import { getSessionUser } from './demoAuth'

export type BranchRecord = {
  id: string
  name: string
  city: string
  manager: string
  status: 'Active' | 'Planned'
}

export type AgentRecord = {
  id: string
  name: string
  email: string
  branch: string
  status: 'Active' | 'On Leave' | 'Inactive'
}

const BRANCHES_KEY = 'ems_branches'
const AGENTS_KEY = 'ems_agents'

const defaultBranches: BranchRecord[] = [
  { id: 'br-01', name: 'Branch Nord', city: 'Milano', manager: 'Roberto Marino', status: 'Active' },
  { id: 'br-02', name: 'Branch Sud', city: 'Napoli', manager: 'Paolo Conti', status: 'Active' },
  { id: 'br-03', name: 'Branch Centro', city: 'Roma', manager: 'Giulia Ferretti', status: 'Planned' },
]

const defaultAgents: AgentRecord[] = [
  { id: 'ag-01', name: 'Marco Rossi', email: 'marco.rossi@trelune.it', branch: 'Branch Nord', status: 'Active' },
  { id: 'ag-02', name: 'Lucia Mancini', email: 'lucia.mancini@trelune.it', branch: 'Branch Nord', status: 'Active' },
  { id: 'ag-03', name: 'Paolo Conti', email: 'paolo.conti@trelune.it', branch: 'Branch Sud', status: 'Active' },
  { id: 'ag-04', name: 'Anna Bellini', email: 'anna.bellini@trelune.it', branch: 'Branch Sud', status: 'On Leave' },
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

function write<T>(key: string, rows: T[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(rows))
}

export function seedOrgData() {
  seed(BRANCHES_KEY, defaultBranches)
  seed(AGENTS_KEY, defaultAgents)
}

export function getBranches(): BranchRecord[] {
  seedOrgData()
  return read<BranchRecord>(BRANCHES_KEY)
}

export function getScopedAgents(): AgentRecord[] {
  seedOrgData()
  const user = getSessionUser()
  const rows = read<AgentRecord>(AGENTS_KEY)
  if (!user) return []
  if (user.role === 'admin') return rows
  if (user.role === 'manager') return rows.filter((r) => r.branch === user.branch)
  return rows.filter((r) => r.name === user.name)
}

export function createAgent(input: Omit<AgentRecord, 'id'>) {
  const row: AgentRecord = { ...input, id: `ag-${Date.now()}` }
  write(AGENTS_KEY, [row, ...read<AgentRecord>(AGENTS_KEY)])
}

export function updateAgent(id: string, patch: Partial<Omit<AgentRecord, 'id'>>) {
  write(
    AGENTS_KEY,
    read<AgentRecord>(AGENTS_KEY).map((r) => (r.id === id ? { ...r, ...patch } : r)),
  )
}

export function deleteAgent(id: string) {
  write(
    AGENTS_KEY,
    read<AgentRecord>(AGENTS_KEY).filter((r) => r.id !== id),
  )
}

export function createBranch(input: Omit<BranchRecord, 'id'>) {
  const row: BranchRecord = { ...input, id: `br-${Date.now()}` }
  write(BRANCHES_KEY, [row, ...read<BranchRecord>(BRANCHES_KEY)])
}
