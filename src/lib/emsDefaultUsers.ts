import { MANAGER_SCOPE_BRANCH } from './sosDemo'

/** Canonical demo accounts — shared by auth seed and login-time full reseed. */
export const EMS_DEFAULT_USERS = [
  {
    id: 'u-admin',
    name: 'Santo Vanzanella',
    email: 'presidente@sosutenzeservizi.it',
    role: 'admin' as const,
    branch: 'All',
    initials: 'SV',
  },
  {
    id: 'u-manager',
    name: 'Elena Esposito',
    email: 'operations.nola@sosutenzeservizi.it',
    role: 'manager' as const,
    branch: MANAGER_SCOPE_BRANCH,
    initials: 'EE',
  },
  {
    id: 'u-employee',
    name: 'Teresa Chiarello',
    email: 'teresa.chiarello@sosutenzeservizi.it',
    role: 'employee' as const,
    branch: MANAGER_SCOPE_BRANCH,
    initials: 'TC',
  },
]
