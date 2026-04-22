import type { DemoUser } from './demoAuth'
import { getSessionUser } from './demoAuth'
import { EMS_DEFAULT_USERS } from './emsDefaultUsers'
import { resetFinance, seedFinance } from './finance'
import { seedOrgData } from './orgData'
import { seedPartnersIfMissing } from './partnersData'
import { resetReporting } from './reporting'
import { resetAllRoleData, seedAllRoleData } from './seed'
import { storeSeedArrayIfMissing } from './store'
import { MANAGER_SCOPE_BRANCH } from './sosDemo'

export type ClientSegment = 'Famiglia' | 'PMI'

export type DemoEmployee = {
  id: string
  name: string
  role: 'Employee'
  branch: string
  assignedAgent: string
  status: 'Active' | 'Pending' | 'Inactive'
  email: string
  segment?: ClientSegment
  currentProvider?: string
  podPdr?: string
  consumptionNote?: string
  hasArrears?: boolean
}

const EMPLOYEES_KEY = 'ems_employees'
const USERS_KEY = 'ems_users'
const PARTNERS_KEY = 'ems_partners'
const SESSION_KEY = 'ems_session'

const defaultEmployees: DemoEmployee[] = [
  {
    id: 'emp-001',
    name: 'Giovanni Rinaldi',
    role: 'Employee',
    branch: 'Nola',
    assignedAgent: 'Teresa Chiarello',
    status: 'Active',
    email: 'g.rinaldi@example.it',
    segment: 'Famiglia',
    currentProvider: 'Enel Energia',
    podPdr: 'IT001E12345678',
    consumptionNote: '3200 kWh/anno',
    hasArrears: false,
  },
  {
    id: 'emp-002',
    name: 'Sofia Bianchi',
    role: 'Employee',
    branch: 'Nola',
    assignedAgent: 'Teresa Chiarello',
    status: 'Active',
    email: 'sofia.bianchi@example.it',
    segment: 'Famiglia',
    currentProvider: 'Eni Plenitude',
    podPdr: 'IT001E88776655',
    consumptionNote: 'Voltura in corso',
    hasArrears: false,
  },
  {
    id: 'emp-003',
    name: 'Martina Greco',
    role: 'Employee',
    branch: 'Nola',
    assignedAgent: 'Lucia Mancini',
    status: 'Inactive',
    email: 'martina.greco@example.it',
    segment: 'PMI',
    currentProvider: 'A2A',
    podPdr: 'IT001E55443322',
    consumptionNote: '4800 kWh',
    hasArrears: true,
  },
  {
    id: 'emp-004',
    name: 'Luca Esposito',
    role: 'Employee',
    branch: 'Salerno',
    assignedAgent: 'Marcella Del Prete',
    status: 'Active',
    email: 'luca.esposito@example.it',
    segment: 'Famiglia',
    currentProvider: 'IREN',
    podPdr: '—',
    consumptionNote: 'Gas 850 Smc',
    hasArrears: false,
  },
  {
    id: 'emp-005',
    name: 'Alessia Romano',
    role: 'Employee',
    branch: 'Nola',
    assignedAgent: 'Lucia Mancini',
    status: 'Active',
    email: 'alessia.romano@example.it',
    segment: 'PMI',
    currentProvider: 'TIM',
    podPdr: 'N/A fibra',
    consumptionNote: 'Sede Cicciano',
    hasArrears: false,
  },
  {
    id: 'emp-006',
    name: 'Francesco De Luca',
    role: 'Employee',
    branch: 'Catania',
    assignedAgent: 'Tiziana De Pasquale',
    status: 'Pending',
    email: 'francesco.deluca@example.it',
    segment: 'Famiglia',
    currentProvider: 'WindTre',
    podPdr: '—',
    consumptionNote: 'Mobile + fibra',
    hasArrears: false,
  },
  {
    id: 'emp-007',
    name: 'Chiara Gallo',
    role: 'Employee',
    branch: 'Verona',
    assignedAgent: 'Luigi Bergamo',
    status: 'Active',
    email: 'chiara.gallo@example.it',
    segment: 'PMI',
    currentProvider: 'Edison',
    podPdr: 'IT003E99887766',
    consumptionNote: 'Ufficio 120 m²',
    hasArrears: false,
  },
  {
    id: 'emp-008',
    name: 'Simone Ferraro',
    role: 'Employee',
    branch: 'Nola',
    assignedAgent: 'Lucia Mancini',
    status: 'Active',
    email: 'simone.ferraro@example.it',
    segment: 'Famiglia',
    currentProvider: 'Vodafone',
    podPdr: '—',
    consumptionNote: 'Solo mobile',
    hasArrears: false,
  },
  {
    id: 'emp-009',
    name: 'Elena Popescu',
    role: 'Employee',
    branch: 'Napoli',
    assignedAgent: 'Angelo Ioime',
    status: 'Active',
    email: 'elena.popescu@example.it',
    segment: 'Famiglia',
    currentProvider: 'Enel',
    podPdr: 'IT001E11223344',
    consumptionNote: 'Subentro appartamento',
    hasArrears: false,
  },
  {
    id: 'emp-010',
    name: 'Antonino Cassone',
    role: 'Employee',
    branch: 'Cicciano',
    assignedAgent: 'Antonio Marrone',
    status: 'Pending',
    email: 'a.cassone@example.it',
    segment: 'PMI',
    currentProvider: 'Eni',
    podPdr: 'IT077E44556677',
    consumptionNote: 'Studio tecnico',
    hasArrears: false,
  },
  {
    id: 'emp-011',
    name: 'Maria Vitale',
    role: 'Employee',
    branch: 'Tropea',
    assignedAgent: 'Attilio Rossi',
    status: 'Active',
    email: 'maria.vitale@example.it',
    segment: 'Famiglia',
    currentProvider: 'E.ON',
    podPdr: 'IT078G22334455',
    consumptionNote: 'Residence stagionale',
    hasArrears: false,
  },
  {
    id: 'emp-012',
    name: 'Roberto Fabbri',
    role: 'Employee',
    branch: 'Cerveteri',
    assignedAgent: 'Laura Martini',
    status: 'Active',
    email: 'roberto.fabbri@example.it',
    segment: 'PMI',
    currentProvider: 'Illumia',
    podPdr: 'IT012E66778899',
    consumptionNote: 'Ristorante',
    hasArrears: true,
  },
]

export function seedEmployeesIfMissing() {
  storeSeedArrayIfMissing(EMPLOYEES_KEY, defaultEmployees)
}

export function getEmployees(): DemoEmployee[] {
  if (typeof window === 'undefined') return []
  seedEmployeesIfMissing()
  const raw = window.localStorage.getItem(EMPLOYEES_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as DemoEmployee[]
  } catch {
    return []
  }
}

export function getScopedEmployees() {
  const user = getSessionUser()
  const all = getEmployees()
  if (!user) return []
  if (user.role === 'admin') return all
  if (user.role === 'manager') return all.filter((item) => item.branch === MANAGER_SCOPE_BRANCH)
  return all.filter((item) => item.assignedAgent === user.name)
}

export function getEmployeeById(id: string): DemoEmployee | null {
  return getScopedEmployees().find((item) => item.id === id) ?? null
}

export function saveEmployees(next: DemoEmployee[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(next))
}

export function createEmployee(input: Omit<DemoEmployee, 'id'>): DemoEmployee {
  const next: DemoEmployee = {
    ...input,
    id: `emp-${Date.now()}`,
  }
  const all = getEmployees()
  saveEmployees([next, ...all])
  return next
}

export function updateEmployee(id: string, patch: Partial<Omit<DemoEmployee, 'id'>>) {
  const all = getEmployees()
  const next = all.map((item) => (item.id === id ? { ...item, ...patch } : item))
  saveEmployees(next)
}

export function deleteEmployee(id: string) {
  const all = getEmployees()
  const next = all.filter((item) => item.id !== id)
  saveEmployees(next)
}

export function resetDemoData() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(USERS_KEY)
  window.localStorage.removeItem(EMPLOYEES_KEY)
  window.localStorage.removeItem(SESSION_KEY)
  window.localStorage.removeItem(PARTNERS_KEY)
  seedEmployeesIfMissing()
}

/** Full demo snapshot (matches Settings reset) — call on every sign-in so each session starts with complete data. */
export function reseedEmsDemoForLogin() {
  if (typeof window === 'undefined') return
  resetDemoData()
  resetAllRoleData()
  resetFinance()
  resetReporting()
  storeSeedArrayIfMissing(USERS_KEY, EMS_DEFAULT_USERS as DemoUser[])
  seedEmployeesIfMissing()
  seedAllRoleData()
  seedOrgData()
  seedFinance()
  seedPartnersIfMissing()
}
