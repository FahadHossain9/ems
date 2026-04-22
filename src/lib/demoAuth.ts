import { reseedEmsDemoForLogin } from './demoData'
import { EMS_DEFAULT_USERS } from './emsDefaultUsers'
import { storeSeedArrayIfMissing } from './store'

export type Role = 'admin' | 'manager' | 'employee'

export type DemoUser = {
  id: string
  name: string
  email: string
  role: Role
  branch: string
  initials: string
}

const USERS_KEY = 'ems_users'
const SESSION_KEY = 'ems_session'

export function seedUsersIfMissing() {
  storeSeedArrayIfMissing(USERS_KEY, EMS_DEFAULT_USERS as DemoUser[])
}

export function getUsers(): DemoUser[] {
  if (typeof window === 'undefined') return []
  seedUsersIfMissing()
  const raw = window.localStorage.getItem(USERS_KEY)
  if (!raw) return []

  try {
    return JSON.parse(raw) as DemoUser[]
  } catch {
    return []
  }
}

export function getSessionUser(): DemoUser | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as DemoUser
  } catch {
    return null
  }
}

export function loginByRole(role: Role): DemoUser | null {
  if (typeof window === 'undefined') return null
  reseedEmsDemoForLogin()
  const user = getUsers().find((item) => item.role === role) ?? null
  if (!user) return null
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  return user
}

export function logout() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(SESSION_KEY)
}

export function updateSessionProfile(patch: Pick<DemoUser, 'name' | 'email' | 'branch'>): DemoUser | null {
  if (typeof window === 'undefined') return null
  const current = getSessionUser()
  if (!current) return null

  const nextUser: DemoUser = {
    ...current,
    ...patch,
    initials: patch.name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  }

  const users = getUsers().map((item) => (item.id === nextUser.id ? nextUser : item))
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser))
  return nextUser
}
