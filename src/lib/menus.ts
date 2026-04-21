import type { Role } from './demoAuth'

export type MenuItem = {
  to: string
  labelKey: string
  icon: string
  badgeKey?: 'reviewQueue' | 'pendingCommissions' | 'myAlerts'
}

export type MenuGroup = {
  titleKey: string
  items: MenuItem[]
}

export const menusByRole: Record<Role, MenuGroup[]> = {
  admin: [
    {
      titleKey: 'workspace',
      items: [
        { to: '/dashboard', labelKey: 'dashboard', icon: '⌂' },
        { to: '/unified-db', labelKey: 'unifiedDb', icon: '◎' },
        { to: '/hierarchy', labelKey: 'hierarchy', icon: '⎈' },
      ],
    },
    {
      titleKey: 'crm',
      items: [
        { to: '/clients', labelKey: 'clients', icon: '◉' },
        { to: '/leads', labelKey: 'leads', icon: '✦' },
        { to: '/pipeline', labelKey: 'pipeline', icon: '⇌' },
        { to: '/agents', labelKey: 'agents', icon: '👤' },
        { to: '/branches', labelKey: 'branches', icon: '🏢' },
        { to: '/partners', labelKey: 'partners', icon: '⎔' },
        { to: '/employees', labelKey: 'employees', icon: '☰' },
      ],
    },
    {
      titleKey: 'finance',
      items: [
        { to: '/commissions', labelKey: 'commissions', icon: '€', badgeKey: 'pendingCommissions' },
        { to: '/invoices', labelKey: 'invoices', icon: '🧾' },
        { to: '/ledger', labelKey: 'ledger', icon: '📒' },
      ],
    },
    {
      titleKey: 'reporting',
      items: [
        { to: '/reporting', labelKey: 'reportingPlatform', icon: '📊' },
        { to: '/reports', labelKey: 'reports', icon: '✎' },
      ],
    },
    {
      titleKey: 'system',
      items: [
        { to: '/sos-sync', labelKey: 'sosSync', icon: '↻' },
        { to: '/tasks', labelKey: 'tasks', icon: '✓' },
        { to: '/settings', labelKey: 'settings', icon: '⚙' },
      ],
    },
  ],
  manager: [
    {
      titleKey: 'workspace',
      items: [
        { to: '/dashboard', labelKey: 'dashboard', icon: '⌂' },
        { to: '/unified-db', labelKey: 'unifiedDb', icon: '◎' },
        { to: '/hierarchy', labelKey: 'hierarchy', icon: '⎈' },
      ],
    },
    {
      titleKey: 'crm',
      items: [
        { to: '/clients', labelKey: 'clients', icon: '◉' },
        { to: '/leads', labelKey: 'leads', icon: '✦' },
        { to: '/pipeline', labelKey: 'pipeline', icon: '⇌' },
        { to: '/agents', labelKey: 'agents', icon: '👤' },
        { to: '/employees', labelKey: 'team', icon: '☰' },
      ],
    },
    {
      titleKey: 'finance',
      items: [
        { to: '/commissions', labelKey: 'commissions', icon: '€' },
      ],
    },
    {
      titleKey: 'reporting',
      items: [
        { to: '/reporting', labelKey: 'reportingPlatform', icon: '📊' },
        { to: '/reports', labelKey: 'reviewQueue', icon: '✎', badgeKey: 'reviewQueue' },
      ],
    },
    {
      titleKey: 'system',
      items: [
        { to: '/tasks', labelKey: 'tasks', icon: '✓' },
        { to: '/profile', labelKey: 'profile', icon: '☻' },
      ],
    },
  ],
  employee: [
    {
      titleKey: 'workspace',
      items: [
        { to: '/dashboard', labelKey: 'dashboard', icon: '⌂' },
        { to: '/clients', labelKey: 'myClients', icon: '◉' },
        { to: '/tasks', labelKey: 'tasks', icon: '✓', badgeKey: 'myAlerts' },
      ],
    },
    {
      titleKey: 'crm',
      items: [
        { to: '/leads', labelKey: 'myLeads', icon: '✦' },
      ],
    },
    {
      titleKey: 'finance',
      items: [
        { to: '/commissions', labelKey: 'myCommissions', icon: '€' },
      ],
    },
    {
      titleKey: 'reporting',
      items: [
        { to: '/reports', labelKey: 'myReports', icon: '✎' },
        { to: '/reports/new', labelKey: 'submitReport', icon: '＋' },
      ],
    },
    {
      titleKey: 'system',
      items: [{ to: '/profile', labelKey: 'profile', icon: '☻' }],
    },
  ],
}

export function getMenuForRole(role: Role | null): MenuGroup[] {
  if (!role) return []
  return menusByRole[role] ?? []
}
