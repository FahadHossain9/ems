import { getSessionUser } from './demoAuth'

export type DemoEmployee = {
  id: string
  name: string
  role: 'Employee'
  branch: string
  assignedAgent: string
  status: 'Active' | 'Pending' | 'Inactive'
  email: string
}

const EMPLOYEES_KEY = 'ems_employees'

const defaultEmployees: DemoEmployee[] = [
  {
    id: 'emp-001',
    name: 'Ahmed Al-Rashid',
    role: 'Employee',
    branch: 'Branch Nord',
    assignedAgent: 'Marco Rossi',
    status: 'Active',
    email: 'ahmed@example.com',
  },
  {
    id: 'emp-002',
    name: 'Fatima Iqbal',
    role: 'Employee',
    branch: 'Branch Nord',
    assignedAgent: 'Marco Rossi',
    status: 'Active',
    email: 'fatima@example.com',
  },
  {
    id: 'emp-003',
    name: 'Ling Chen',
    role: 'Employee',
    branch: 'Branch Nord',
    assignedAgent: 'Lucia Mancini',
    status: 'Inactive',
    email: 'ling@example.com',
  },
  {
    id: 'emp-004',
    name: 'Raj Patel',
    role: 'Employee',
    branch: 'Branch Sud',
    assignedAgent: 'Paolo Conti',
    status: 'Pending',
    email: 'raj@example.com',
  },
  {
    id: 'emp-005',
    name: 'Giovanni Rinaldi',
    role: 'Employee',
    branch: 'Branch Nord',
    assignedAgent: 'Lucia Mancini',
    status: 'Active',
    email: 'giovanni.rinaldi@example.it',
  },
  {
    id: 'emp-006',
    name: 'Sofia Bianchi',
    role: 'Employee',
    branch: 'Branch Nord',
    assignedAgent: 'Marco Rossi',
    status: 'Pending',
    email: 'sofia.bianchi@example.it',
  },
  {
    id: 'emp-007',
    name: 'Luca Esposito',
    role: 'Employee',
    branch: 'Branch Sud',
    assignedAgent: 'Paolo Conti',
    status: 'Active',
    email: 'luca.esposito@example.it',
  },
  {
    id: 'emp-008',
    name: 'Alessia Romano',
    role: 'Employee',
    branch: 'Branch Nord',
    assignedAgent: 'Lucia Mancini',
    status: 'Active',
    email: 'alessia.romano@example.it',
  },
  {
    id: 'emp-009',
    name: 'Francesco De Luca',
    role: 'Employee',
    branch: 'Branch Sud',
    assignedAgent: 'Paolo Conti',
    status: 'Pending',
    email: 'francesco.deluca@example.it',
  },
  {
    id: 'emp-010',
    name: 'Martina Greco',
    role: 'Employee',
    branch: 'Branch Nord',
    assignedAgent: 'Marco Rossi',
    status: 'Inactive',
    email: 'martina.greco@example.it',
  },
  {
    id: 'emp-011',
    name: 'Simone Ferraro',
    role: 'Employee',
    branch: 'Branch Nord',
    assignedAgent: 'Lucia Mancini',
    status: 'Active',
    email: 'simone.ferraro@example.it',
  },
  {
    id: 'emp-012',
    name: 'Chiara Gallo',
    role: 'Employee',
    branch: 'Branch Sud',
    assignedAgent: 'Paolo Conti',
    status: 'Active',
    email: 'chiara.gallo@example.it',
  },
]

export function seedEmployeesIfMissing() {
  if (typeof window === 'undefined') return
  if (!window.localStorage.getItem(EMPLOYEES_KEY)) {
    window.localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(defaultEmployees))
  }
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
  if (user.role === 'manager') return all.filter((item) => item.branch === 'Branch Nord')
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
  window.localStorage.removeItem('ems_users')
  window.localStorage.removeItem('ems_employees')
  window.localStorage.removeItem('ems_session')
  window.localStorage.removeItem('ems_partners')
  seedEmployeesIfMissing()
}
