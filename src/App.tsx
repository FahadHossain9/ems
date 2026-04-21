import { useEffect, useRef, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BrowserRouter, Link, NavLink, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getSessionUser, loginByRole, logout, seedUsersIfMissing, updateSessionProfile } from './lib/demoAuth'
import type { Role } from './lib/demoAuth'
import { createEmployee, deleteEmployee, getEmployeeById, getScopedEmployees, resetDemoData, seedEmployeesIfMissing, updateEmployee } from './lib/demoData'
import {
  createLead,
  createReport,
  deleteLead,
  deleteReport,
  getActivity,
  getCommissions,
  getLeads,
  getNotifications,
  getReports,
  seedAllRoleData,
  resetAllRoleData,
  updateLead,
  updateReport,
} from './lib/seed'
import type { DemoLead, LeadStage } from './lib/seed'
import { getMenuForRole } from './lib/menus'
import { createAgent, createBranch, deleteAgent, getBranches, getScopedAgents, seedOrgData } from './lib/orgData'
import {
  addLedgerEntry,
  deleteInvoice,
  deleteLedgerEntry,
  generateInvoiceForAgent,
  getCashFlowByMonth,
  getInvoices,
  getLedger,
  getRules,
  resetFinance,
  runCommissionCalculation,
  saveRules,
  seedFinance,
  updateInvoiceStatus,
} from './lib/finance'
import type { InvoiceStatus } from './lib/finance'
import { buildHierarchy } from './lib/hierarchy'
import type { HierarchyNode } from './lib/hierarchy'
import {
  PRESET_LABELS,
  deleteSavedView,
  getSavedViews,
  resetReporting,
  runReport,
  saveView,
} from './lib/reporting'
import type { ReportPresetId, SavedView } from './lib/reporting'
import { exportCsv, exportJson } from './lib/exporters'
import { createPartner, deletePartner, getPartners, seedPartnersIfMissing, updatePartner } from './lib/partnersData'

function getCurrentRole(): Role | null {
  return getSessionUser()?.role ?? null
}

const PAGE_SIZE = 6
const STATUS_REMARKS_KEY = 'ems_status_remarks'
const BRANCH_OPTIONS = ['Branch Nord', 'Branch Sud']
const AGENTS_BY_BRANCH: Record<string, string[]> = {
  'Branch Nord': ['Marco Rossi', 'Lucia Mancini'],
  'Branch Sud': ['Paolo Conti'],
}

function paginate<T>(items: T[], page: number, size = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / size))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * size
  return {
    rows: items.slice(start, start + size),
    totalPages,
    safePage,
  }
}

type StatusRemarkEntry = {
  id: string
  entity: 'lead' | 'employee'
  entityId: string
  from: string
  to: string
  remark: string
  by: string
  at: string
}

function readStatusRemarks(): StatusRemarkEntry[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(STATUS_REMARKS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as StatusRemarkEntry[]
  } catch {
    return []
  }
}

function addStatusRemark(input: Omit<StatusRemarkEntry, 'id' | 'at'>) {
  if (typeof window === 'undefined') return
  const next: StatusRemarkEntry = {
    ...input,
    id: `remark-${Date.now()}`,
    at: new Date().toLocaleString(),
  }
  window.localStorage.setItem(STATUS_REMARKS_KEY, JSON.stringify([next, ...readStatusRemarks()]))
}

function getStatusRemarks(entity: 'lead' | 'employee', entityId: string) {
  return readStatusRemarks().filter((item) => item.entity === entity && item.entityId === entityId)
}

function TablePager({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (next: number) => void }) {
  return (
    <div className="pager">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Prev
      </button>
      <span>
        Page {page} / {totalPages}
      </span>
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </div>
  )
}

function FormModal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ConfirmModal({
  open,
  title,
  message,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  message: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <FormModal open={open} title={title} onClose={onCancel}>
      <div className="modal-form">
        <p className="confirm-message">{message}</p>
        <div className="row-actions">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </FormModal>
  )
}

function ActionIconButton({
  icon,
  label,
  onClick,
}: {
  icon: string
  label: string
  onClick: () => void
}) {
  return (
    <button className="icon-action-btn" title={label} aria-label={label} onClick={onClick}>
      <span aria-hidden>{icon}</span>
    </button>
  )
}

function useBulkSelection(ids: string[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const idsKey = ids.join('|')

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => ids.includes(id)))
  }, [idsKey])

  function toggleOne(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? ids : [])
  }

  return {
    selectedIds,
    setSelectedIds,
    toggleOne,
    toggleAll,
    isAllSelected: ids.length > 0 && selectedIds.length === ids.length,
  }
}

function ProtectedRoute() {
  const location = useLocation()
  const role = getCurrentRole()
  if (!role) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

function RoleRoute({ allow }: { allow: Role[] }) {
  const role = getCurrentRole()
  if (!role) return <Navigate to="/login" replace />
  if (!allow.includes(role)) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

function AppLayout() {
  const role = getCurrentRole()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const user = getSessionUser()
  const notifications = getNotifications()
  const unread = notifications.filter((n) => !n.read).length
  const reviewQueueCount = getReports().filter(
    (r) => r.status === 'Submitted' || r.status === 'Under Review',
  ).length
  const pendingCommissionCount = getCommissions().filter((c) => c.status === 'Pending').length
  const [notifOpen, setNotifOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('ems_sidebar_collapsed') === '1'
  })
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false
    return Boolean(document.fullscreenElement)
  })
  const notifWrapRef = useRef<HTMLDivElement | null>(null)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function switchLocale(locale: 'en' | 'it') {
    void i18n.changeLanguage(locale)
    window.localStorage.setItem('ems_locale', locale)
  }

  const pageTitles: Record<string, string> = {
    '/dashboard': t('dashboard'),
    '/clients': t('clients'),
    '/employees': t('employees'),
    '/tasks': t('tasks'),
    '/profile': t('profile'),
    '/settings': t('settings'),
    '/reports': t('reports'),
    '/reports/new': t('submitReport'),
    '/leads': t('leads'),
    '/agents': t('agents'),
    '/branches': t('branches'),
    '/pipeline': t('pipeline'),
    '/commissions': t('commissions'),
    '/partners': t('partners'),
    '/sos-sync': t('sosSync'),
    '/unified-db': t('unifiedDb'),
    '/hierarchy': t('hierarchy'),
    '/invoices': t('invoices'),
    '/ledger': t('ledger'),
    '/reporting': t('reportingPlatform'),
  }
  const currentTitle =
    pageTitles[location.pathname] ??
    (location.pathname.startsWith('/employees/') ? t('employees') : 'Dashboard')

  useEffect(() => {
    setNotifOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('ems_sidebar_collapsed', sidebarCollapsed ? '1' : '0')
  }, [sidebarCollapsed])

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    if (!notifOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (!notifWrapRef.current) return
      if (!notifWrapRef.current.contains(event.target as Node)) {
        setNotifOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setNotifOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [notifOpen])

  const initials = (user?.name ?? 'U U')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {
      // Browser may block fullscreen without user gesture/permission.
    }
  }

  return (
    <div className="app-bg">
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <div className="orb orb-three" />
      <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <aside className="sidebar glass">
          <button
            className="sidebar-toggle"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setSidebarCollapsed((prev) => !prev)}
          >
            {sidebarCollapsed ? '⟩' : '⟨'}
          </button>
          <div className="brand">
            <span className="brand-mark">TL</span>
            <div>
              <h2>Tre Lune EMS</h2>
              <p className="side-subtitle">
                {role === 'admin'
                  ? t('navLabelAdmin')
                  : role === 'manager'
                  ? t('navLabelManager')
                  : t('navLabelAgent')}
              </p>
            </div>
          </div>
          {getMenuForRole(role).map((group) => (
            <div key={group.titleKey} className="nav-group">
              <p className="nav-title">{t(group.titleKey)}</p>
              <nav>
                {group.items.map((item) => {
                  const badge =
                    item.badgeKey === 'reviewQueue'
                      ? reviewQueueCount
                      : item.badgeKey === 'pendingCommissions'
                      ? pendingCommissionCount
                      : item.badgeKey === 'myAlerts'
                      ? unread
                      : 0
                  return (
                    <NavLink key={item.to} to={item.to} end={item.to === '/dashboard'}>
                      <span className="nav-ico" aria-hidden>
                        {item.icon}
                      </span>
                      <span className="nav-label">{t(item.labelKey)}</span>
                      {badge > 0 ? <span className="nav-badge">{badge}</span> : null}
                    </NavLink>
                  )
                })}
              </nav>
            </div>
          ))}
          <p className="role-text">
            <span className={`role-pill role-${role}`}>{role ?? 'guest'}</span>
          </p>
        </aside>
        <div className="main-col">
          <header className="topbar glass">
            <div className="topbar-left">
              <p className="crumb">
                Tre Lune EMS / {currentTitle}
                <span className="unified-badge" title="One session · all pillars">● {t('unifiedSession')}</span>
              </p>
              <h2 className="topbar-title">{currentTitle}</h2>
            </div>
            <div className="topbar-search">
              <input
                type="search"
                placeholder={t('searchPlaceholder', {
                  defaultValue: 'Search clients, leads, reports…',
                })}
              />
            </div>
            <div className="topbar-right">
              <button
                className="icon-btn"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                onClick={toggleFullscreen}
              >
                <span aria-hidden>{isFullscreen ? '🗗' : '⛶'}</span>
              </button>
              <div className="lang-switch compact">
                <button
                  className={i18n.language === 'it' ? 'active' : ''}
                  onClick={() => switchLocale('it')}
                  aria-label="Italiano"
                >
                  <span className="flag" aria-hidden>🇮🇹</span>
                  <span>IT</span>
                </button>
                <button
                  className={i18n.language === 'en' ? 'active' : ''}
                  onClick={() => switchLocale('en')}
                  aria-label="English"
                >
                  <span className="flag" aria-hidden>🇬🇧</span>
                  <span>EN</span>
                </button>
              </div>
              <div className="bell-wrap" ref={notifWrapRef}>
                <button
                  className="icon-btn"
                  aria-label="Notifications"
                  onClick={() => setNotifOpen((v) => !v)}
                >
                  <span aria-hidden>🔔</span>
                  {unread > 0 ? <span className="badge">{unread}</span> : null}
                </button>
                {notifOpen ? (
                  <div className="notif-panel glass">
                    <header>
                      <strong>Notifications</strong>
                      <small>{unread} unread</small>
                    </header>
                    {notifications.length === 0 ? (
                      <p className="notif-empty">No notifications.</p>
                    ) : (
                      <ul>
                        {notifications.slice(0, 6).map((n) => (
                          <li key={n.id} className={n.read ? 'read' : 'unread'}>
                            <span
                              className={`dot dot-${n.type === 'alert' ? 'alert' : 'update'}`}
                            />
                            <div>
                              <p>{n.text}</p>
                              <small>{n.createdAt}</small>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </div>
              <div className="user-chip">
                <span className="avatar">{initials}</span>
                <div className="user-meta">
                  <strong>{user?.name ?? 'Guest'}</strong>
                  <small>{role}</small>
                </div>
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                {t('signOut')}
              </button>
            </div>
          </header>
          <main className="content glass">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

function LoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const { t, i18n } = useTranslation()

  useEffect(() => {
    seedUsersIfMissing()
    seedEmployeesIfMissing()
    seedAllRoleData()
    seedOrgData()
    seedFinance()
    seedPartnersIfMissing()
    if (getSessionUser()) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  function handleLogin(role: Role) {
    const user = loginByRole(role)
    if (!user) {
      setError('Unable to login demo user.')
      return
    }
    navigate('/dashboard', { replace: true })
  }

  function switchLocale(locale: 'en' | 'it') {
    void i18n.changeLanguage(locale)
    window.localStorage.setItem('ems_locale', locale)
  }

  return (
    <section className="login-page app-bg">
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <div className="login-card glass">
        <h1>{t('loginTitle')}</h1>
        <p>{t('loginHint')}</p>
        <nav>
          <div className="lang-switch compact">
            <button onClick={() => switchLocale('it')} aria-label="Italiano">
              <span className="flag" aria-hidden>🇮🇹</span>
              <span>IT</span>
            </button>
            <button onClick={() => switchLocale('en')} aria-label="English">
              <span className="flag" aria-hidden>🇬🇧</span>
              <span>EN</span>
            </button>
          </div>
        </nav>
        <div className="login-actions">
          <button onClick={() => handleLogin('admin')}>{t('adminLogin')}</button>
          <button onClick={() => handleLogin('manager')}>{t('managerLogin')}</button>
          <button onClick={() => handleLogin('employee')}>{t('employeeLogin')}</button>
        </div>
        {error ? <p>{error}</p> : null}
      </div>
    </section>
  )
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <section>
      <h1>{title}</h1>
      <p>Page scaffolded. Feature implementation is planned next.</p>
    </section>
  )
}

const chartColors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444']

function DashboardHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) {
  return (
    <header className="dashboard-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions ? <div className="header-actions">{actions}</div> : null}
    </header>
  )
}

function KpiRow({ cards }: { cards: { label: string; value: string; trend?: string }[] }) {
  return (
    <div className="kpi-grid">
      {cards.map((card) => (
        <article key={card.label} className="kpi-card glass">
          <p className="kpi-label">{card.label}</p>
          <p className="kpi-value">{card.value}</p>
          {card.trend ? <p className="kpi-trend">{card.trend}</p> : null}
        </article>
      ))}
    </div>
  )
}

function AdminDashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const commissions = getCommissions()
  const leads = getLeads()
  const activity = getActivity()
  const wonLeads = leads.filter((l) => l.stage === 'Won')
  const revenue = wonLeads.reduce((sum, l) => sum + (l.contractValue ?? 0), 0)
  const conversion = leads.length > 0 ? (wonLeads.length / leads.length) * 100 : 0
  const outcomeData = [
    { name: 'Won', value: leads.filter((l) => l.stage === 'Won').length },
    { name: 'Lost', value: leads.filter((l) => l.stage === 'Lost').length },
    { name: 'Active', value: leads.filter((l) => l.stage !== 'Won' && l.stage !== 'Lost').length },
  ]
  const pieData = (['Pending', 'Approved', 'Paid', 'Disputed'] as const).map((name) => ({
    name,
    value: commissions.filter((c) => c.status === name).length,
  }))
  const trendData = [
    { month: 'Jan', value: 38000 }, { month: 'Feb', value: 42000 },
    { month: 'Mar', value: 51000 }, { month: 'Apr', value: 56000 },
    { month: 'May', value: 49000 }, { month: 'Jun', value: 61000 },
  ]
  const pipelineValue = leads
    .filter((lead) => lead.stage === 'Won')
    .reduce((sum, lead) => sum + (lead.contractValue ?? 0), 0)

  const cards = [
    { label: 'Total Clients', value: '47', trend: '+12% vs last month' },
    { label: 'Pipeline Value', value: `€${pipelineValue.toLocaleString()}`, trend: '+8%' },
    { label: 'Open Leads', value: String(leads.filter((l) => l.stage !== 'Won' && l.stage !== 'Lost').length) },
    { label: 'Commissions Pending', value: String(commissions.filter((c) => c.status === 'Pending').length) },
  ]

  return (
    <section className="dashboard">
      <DashboardHeader
        title="Company Overview"
        subtitle="Admin view — all branches, all agents"
        actions={
          <>
            <button onClick={() => navigate('/clients')}>+ New Client</button>
            <button
              onClick={() => {
                const created = runCommissionCalculation()
                window.alert(
                  created > 0
                    ? `Created ${created} commission ${created === 1 ? 'entry' : 'entries'}.`
                    : 'No new commissions were created.',
                )
                navigate('/commissions')
              }}
            >
              Run Commissions
            </button>
          </>
        }
      />
      <KpiRow cards={cards} />
      <section className="sales-network glass">
        <header className="sales-network-head">
          <h3>{t('salesNetwork')}</h3>
          <span className="sales-network-sub">CRM Dashboard — {t('revenue')} · {t('deals')} · {t('conversionRate')}</span>
        </header>
        <div className="sales-network-grid">
          <div className="sn-kpi">
            <small>{t('revenue')}</small>
            <strong>€{revenue.toLocaleString()}</strong>
          </div>
          <div className="sn-kpi">
            <small>{t('deals')}</small>
            <strong>{wonLeads.length}</strong>
          </div>
          <div className="sn-kpi">
            <small>{t('conversionRate')}</small>
            <strong>{conversion.toFixed(1)}%</strong>
          </div>
          <div className="sn-chart">
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={outcomeData} dataKey="value" nameKey="name" innerRadius={30} outerRadius={55} paddingAngle={3}>
                  {outcomeData.map((entry, idx) => (
                    <Cell key={entry.name} fill={chartColors[idx]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="legend small">
              {outcomeData.map((entry, idx) => (
                <span key={entry.name}>
                  <i style={{ background: chartColors[idx] }} /> {entry.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="dashboard-row">
        <article className="chart-card glass">
          <h3>Monthly Pipeline Value</h3>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorValueAdmin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                <XAxis dataKey="month" stroke="#cbd5e1" />
                <YAxis stroke="#cbd5e1" />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#60a5fa" fillOpacity={1} fill="url(#colorValueAdmin)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="chart-card glass">
          <h3>Commission Status</h3>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="legend">
            {pieData.map((entry, index) => (
              <span key={entry.name}>
                <i style={{ background: chartColors[index] }} /> {entry.name}
              </span>
            ))}
          </div>
        </article>
      </section>
      <section className="dashboard-row">
        <article className="chart-card glass">
          <h3>Recent Activity</h3>
          <ul className="feed">
            {activity.slice(0, 6).map((a) => (
              <li key={a.id}>
                <span className={`dot dot-${a.kind}`} />
                <span>{a.text}</span>
                <small>{a.createdAt}</small>
              </li>
            ))}
          </ul>
        </article>
        <article className="chart-card glass">
          <h3>SOS Sync Health</h3>
          <p className="sync-ok">SOS Sync Active — last run 14 Apr 2025 10:00</p>
          <p>12 imported, 3 pushed</p>
          <button onClick={() => navigate('/sos-sync')}>Sync Now</button>
        </article>
      </section>
    </section>
  )
}

function ManagerDashboard() {
  const reports = getReports()
  const leads = getLeads()
  const reviewQueue = reports.filter((r) => r.status === 'Submitted' || r.status === 'Under Review')
  const staleLeads = leads.filter((l) => l.stageAgeDays >= 14 && l.stage !== 'Won' && l.stage !== 'Lost')
  const wonValue = leads.filter((l) => l.stage === 'Won').reduce((sum, l) => sum + (l.contractValue ?? 0), 0)

  const agentLoad = Array.from(
    leads.reduce((map, lead) => {
      map.set(lead.assignedAgent, (map.get(lead.assignedAgent) ?? 0) + 1)
      return map
    }, new Map<string, number>()),
  ).map(([name, tasks]) => ({ name, tasks }))

  const cards = [
    { label: 'Branch Clients', value: '18', trend: 'Branch Nord' },
    { label: 'Branch Pipeline', value: `€${wonValue.toLocaleString()}` },
    { label: 'Open Leads', value: String(leads.filter((l) => l.stage !== 'Won' && l.stage !== 'Lost').length) },
    { label: 'Review Queue', value: String(reviewQueue.length) },
  ]

  return (
    <section className="dashboard">
      <DashboardHeader
        title="Branch Nord Overview"
        subtitle="Manager view — review queue and team performance"
        actions={<><Link to="/reports" className="link-btn">Open Review Queue</Link></>}
      />
      <KpiRow cards={cards} />
      <section className="dashboard-row">
        <article className="chart-card glass">
          <h3>Reports Awaiting Review</h3>
          {reviewQueue.length === 0 ? (
            <p>No reports awaiting review. All caught up.</p>
          ) : (
            <ul className="feed">
              {reviewQueue.map((r) => (
                <li key={r.id}>
                  <span className="dot dot-update" />
                  <span>
                    {r.id} — {r.agent} submitted for {r.client}
                  </span>
                  <small>{r.serviceType}</small>
                </li>
              ))}
            </ul>
          )}
        </article>
        <article className="chart-card glass">
          <h3>Stale Leads</h3>
          {staleLeads.length === 0 ? (
            <p>No stale leads in branch.</p>
          ) : (
            <ul className="feed">
              {staleLeads.map((l) => (
                <li key={l.id}>
                  <span className={`dot ${l.stageAgeDays >= 30 ? 'dot-alert' : 'dot-stage'}`} />
                  <span>
                    {l.company} — {l.stage}
                  </span>
                  <small>{l.stageAgeDays}d</small>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
      <section className="dashboard-row">
        <article className="chart-card glass">
          <h3>Agent Workload</h3>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={agentLoad}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                <XAxis dataKey="name" stroke="#cbd5e1" />
                <YAxis stroke="#cbd5e1" />
                <Tooltip />
                <Bar dataKey="tasks" fill="#818cf8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </section>
  )
}

function AgentDashboard() {
  const leads = getLeads()
  const reports = getReports()
  const commissions = getCommissions()
  const notifications = getNotifications()

  const myPipeline = leads.filter((l) => l.stage === 'Won').reduce((sum, l) => sum + (l.contractValue ?? 0), 0)
  const pendingCommissions = commissions.filter((c) => c.status === 'Pending')
  const rejectedReports = reports.filter((r) => r.status === 'Rejected')

  const cards = [
    { label: 'My Clients', value: '8' },
    { label: 'My Pipeline', value: `€${myPipeline.toLocaleString()}` },
    { label: 'My Open Leads', value: String(leads.filter((l) => l.stage !== 'Won' && l.stage !== 'Lost').length) },
    { label: 'My Pending Commission', value: `€${pendingCommissions.reduce((s, c) => s + c.amount, 0).toLocaleString()}` },
  ]

  return (
    <section className="dashboard">
      <DashboardHeader
        title="My Workspace"
        subtitle="Agent view — only my clients, leads and commissions"
        actions={<><Link to="/reports/new" className="link-btn">Submit Report</Link></>}
      />
      <KpiRow cards={cards} />
      <section className="dashboard-row">
        <article className="chart-card glass">
          <h3>My Alerts</h3>
          {notifications.length === 0 ? (
            <p>No alerts. You are all caught up.</p>
          ) : (
            <ul className="feed">
              {notifications.slice(0, 6).map((n) => (
                <li key={n.id}>
                  <span className={`dot dot-${n.type === 'alert' ? 'alert' : 'update'}`} />
                  <span>{n.text}</span>
                  <small>{n.createdAt}</small>
                </li>
              ))}
            </ul>
          )}
        </article>
        <article className="chart-card glass">
          <h3>My Pending Commissions</h3>
          {pendingCommissions.length === 0 ? (
            <p>No pending commissions.</p>
          ) : (
            <ul className="feed">
              {pendingCommissions.map((c) => (
                <li key={c.id}>
                  <span className="dot dot-stage" />
                  <span>
                    {c.id} — {c.deal}
                  </span>
                  <small>€{c.amount}</small>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
      {rejectedReports.length > 0 ? (
        <section className="dashboard-row">
          <article className="chart-card glass">
            <h3>Rejected Reports to Resubmit</h3>
            <ul className="feed">
              {rejectedReports.map((r) => (
                <li key={r.id}>
                  <span className="dot dot-alert" />
                  <span>
                    {r.id} — {r.rejectionReason ?? 'Rejected'}
                  </span>
                  <small>{r.reviewedBy}</small>
                </li>
              ))}
            </ul>
          </article>
        </section>
      ) : null}
    </section>
  )
}

function DashboardPage() {
  const role = getCurrentRole()
  if (role === 'admin') return <AdminDashboard />
  if (role === 'manager') return <ManagerDashboard />
  return <AgentDashboard />
}

function EmployeesPage() {
  const role = getCurrentRole()
  const user = getSessionUser()
  const canManage = role === 'admin' || role === 'manager'
  const [employees, setEmployees] = useState(() => getScopedEmployees())
  const [page, setPage] = useState(1)
  const [draft, setDraft] = useState({
    name: '',
    email: '',
    branch: role === 'manager' ? 'Branch Nord' : 'Branch Nord',
    assignedAgent: 'Marco Rossi',
    status: 'Pending' as 'Active' | 'Pending' | 'Inactive',
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<null | {
    id: string
    name: string
    email: string
    branch: string
    assignedAgent: string
    status: 'Active' | 'Pending' | 'Inactive'
  }>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [statusRemarkText, setStatusRemarkText] = useState('')
  const [pendingStatusChange, setPendingStatusChange] = useState<null | {
    id: string
    from: 'Active' | 'Pending' | 'Inactive'
    to: 'Active' | 'Pending' | 'Inactive'
  }>(null)
  const [pendingBulkStatus, setPendingBulkStatus] = useState<null | {
    to: 'Active' | 'Pending' | 'Inactive'
  }>(null)
  const { rows, totalPages, safePage } = paginate(employees, page)
  const {
    selectedIds,
    setSelectedIds,
    toggleOne,
    toggleAll,
    isAllSelected,
  } = useBulkSelection(rows.map((item) => item.id))

  function refresh() {
    setEmployees(getScopedEmployees())
  }

  function handleCreate() {
    if (!canManage || !draft.name.trim() || !draft.email.trim()) return
    createEmployee({
      name: draft.name.trim(),
      email: draft.email.trim(),
      branch: role === 'manager' ? 'Branch Nord' : draft.branch,
      assignedAgent: draft.assignedAgent,
      status: draft.status,
      role: 'Employee',
    })
    setDraft((prev) => ({ ...prev, name: '', email: '' }))
    setShowCreateModal(false)
    refresh()
  }

  function openEditModal(id: string) {
    const item = employees.find((employee) => employee.id === id)
    if (!item || !canManage) return
    setEditingEmployee({
      id: item.id,
      name: item.name,
      email: item.email,
      branch: item.branch,
      assignedAgent: item.assignedAgent,
      status: item.status,
    })
  }

  function handleSaveEmployeeEdit() {
    if (!editingEmployee || !canManage) return
    updateEmployee(editingEmployee.id, {
      name: editingEmployee.name,
      email: editingEmployee.email,
      branch: role === 'manager' ? 'Branch Nord' : editingEmployee.branch,
      assignedAgent: editingEmployee.assignedAgent,
      status: editingEmployee.status,
    })
    setEditingEmployee(null)
    refresh()
  }

  function handleStatusOnly(id: string, status: 'Active' | 'Pending' | 'Inactive') {
    const row = employees.find((item) => item.id === id)
    if (!row || row.status === status) return
    setPendingStatusChange({ id, from: row.status, to: status })
    setStatusRemarkText('')
  }

  function handleDelete(id: string) {
    if (!canManage) return
    setDeleteTargetId(id)
  }

  function confirmDelete() {
    if (!canManage || !deleteTargetId) return
    deleteEmployee(deleteTargetId)
    setDeleteTargetId(null)
    refresh()
  }

  function handleBulkDelete() {
    if (!canManage || selectedIds.length === 0) return
    selectedIds.forEach((id) => deleteEmployee(id))
    setSelectedIds([])
    refresh()
  }

  function handleBulkStatus(status: 'Active' | 'Pending' | 'Inactive') {
    if (selectedIds.length === 0) return
    setPendingBulkStatus({ to: status })
    setStatusRemarkText('')
  }

  function confirmStatusChange() {
    if (!pendingStatusChange || !statusRemarkText.trim()) return
    updateEmployee(pendingStatusChange.id, { status: pendingStatusChange.to })
    addStatusRemark({
      entity: 'employee',
      entityId: pendingStatusChange.id,
      from: pendingStatusChange.from,
      to: pendingStatusChange.to,
      remark: statusRemarkText.trim(),
      by: user?.name ?? 'Unknown',
    })
    setPendingStatusChange(null)
    setStatusRemarkText('')
    refresh()
  }

  function confirmBulkStatusChange() {
    if (!pendingBulkStatus || !statusRemarkText.trim()) return
    selectedIds.forEach((id) => {
      const row = employees.find((item) => item.id === id)
      if (!row || row.status === pendingBulkStatus.to) return
      updateEmployee(id, { status: pendingBulkStatus.to })
      addStatusRemark({
        entity: 'employee',
        entityId: id,
        from: row.status,
        to: pendingBulkStatus.to,
        remark: statusRemarkText.trim(),
        by: user?.name ?? 'Unknown',
      })
    })
    setSelectedIds([])
    setPendingBulkStatus(null)
    setStatusRemarkText('')
    refresh()
  }

  return (
    <section>
      <h1>Employees</h1>
      <p>{employees.length} records in your scope</p>
      {canManage ? (
        <div className="row-actions" style={{ marginTop: 12 }}>
          <button onClick={() => setShowCreateModal(true)}>➕ Add Employee</button>
        </div>
      ) : null}
      {selectedIds.length > 0 ? (
        <div className="bulk-bar">
          <span>{selectedIds.length} selected</span>
          <div className="row-actions">
            <button onClick={() => handleBulkStatus('Active')}>Bulk Active</button>
            <button onClick={() => handleBulkStatus('Pending')}>Bulk Pending</button>
            <button onClick={() => handleBulkStatus('Inactive')}>Bulk Inactive</button>
            {canManage ? <button onClick={handleBulkDelete}>Bulk Delete</button> : null}
          </div>
        </div>
      ) : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => toggleAll(e.target.checked)}
                />
              </th>
              <th>SL</th>
              <th>Name</th>
              <th>Branch</th>
              <th>Assigned Agent</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((employee, idx) => (
              <tr key={employee.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(employee.id)}
                    onChange={() => toggleOne(employee.id)}
                  />
                </td>
                <td>{(safePage - 1) * PAGE_SIZE + idx + 1}</td>
                <td>
                  <Link to={`/employees/${employee.id}`}>{employee.name}</Link>
                </td>
                <td>{employee.branch}</td>
                <td>{employee.assignedAgent}</td>
                <td>
                  {role === 'employee' ? (
                    <select
                      value={employee.status}
                      onChange={(e) =>
                        handleStatusOnly(
                          employee.id,
                          e.target.value as 'Active' | 'Pending' | 'Inactive',
                        )
                      }
                    >
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  ) : (
                    employee.status
                  )}
                </td>
                <td>
                  {canManage ? (
                    <div className="row-actions">
                      <ActionIconButton icon="✏️" label="Edit employee" onClick={() => openEditModal(employee.id)} />
                      <ActionIconButton icon="🗑️" label="Delete employee" onClick={() => handleDelete(employee.id)} />
                    </div>
                  ) : (
                    <span className="muted">Limited</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePager page={safePage} totalPages={totalPages} onChange={setPage} />
      <FormModal open={showCreateModal} title="Add Employee" onClose={() => setShowCreateModal(false)}>
        <div className="modal-form">
          <input
            placeholder="Name"
            value={draft.name}
            onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
          />
          <input
            placeholder="Email"
            value={draft.email}
            onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))}
          />
          <select
            disabled={role === 'manager'}
            value={draft.branch}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                branch: e.target.value,
                assignedAgent: AGENTS_BY_BRANCH[e.target.value]?.[0] ?? prev.assignedAgent,
              }))
            }
          >
            {BRANCH_OPTIONS.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
          <select
            value={draft.assignedAgent}
            onChange={(e) => setDraft((prev) => ({ ...prev, assignedAgent: e.target.value }))}
          >
            {(AGENTS_BY_BRANCH[role === 'manager' ? 'Branch Nord' : draft.branch] ?? []).map((agent) => (
              <option key={agent} value={agent}>
                {agent}
              </option>
            ))}
          </select>
          <div className="row-actions">
            <button onClick={handleCreate}>Save</button>
          </div>
        </div>
      </FormModal>
      <FormModal open={Boolean(editingEmployee)} title="Edit Employee" onClose={() => setEditingEmployee(null)}>
        {editingEmployee ? (
          <div className="modal-form">
            <input
              placeholder="Name"
              value={editingEmployee.name}
              onChange={(e) => setEditingEmployee((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
            />
            <input
              placeholder="Email"
              value={editingEmployee.email}
              onChange={(e) => setEditingEmployee((prev) => (prev ? { ...prev, email: e.target.value } : prev))}
            />
            <select
              disabled={role === 'manager'}
              value={editingEmployee.branch}
              onChange={(e) =>
                setEditingEmployee((prev) =>
                  prev
                    ? {
                        ...prev,
                        branch: e.target.value,
                        assignedAgent: AGENTS_BY_BRANCH[e.target.value]?.[0] ?? prev.assignedAgent,
                      }
                    : prev,
                )
              }
            >
              {BRANCH_OPTIONS.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
            <select
              value={editingEmployee.assignedAgent}
              onChange={(e) =>
                setEditingEmployee((prev) => (prev ? { ...prev, assignedAgent: e.target.value } : prev))
              }
            >
              {(AGENTS_BY_BRANCH[role === 'manager' ? 'Branch Nord' : editingEmployee.branch] ?? []).map((agent) => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </select>
            <select
              value={editingEmployee.status}
              onChange={(e) =>
                setEditingEmployee((prev) =>
                  prev ? { ...prev, status: e.target.value as 'Active' | 'Pending' | 'Inactive' } : prev,
                )
              }
            >
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>
            <div className="row-actions">
              <button onClick={handleSaveEmployeeEdit}>Save</button>
            </div>
          </div>
        ) : null}
      </FormModal>
      <ConfirmModal
        open={Boolean(deleteTargetId)}
        title="Delete Employee"
        message="Are you sure you want to delete this employee record?"
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
      />
      <FormModal
        open={Boolean(pendingStatusChange)}
        title="Status Change Remark"
        onClose={() => setPendingStatusChange(null)}
      >
        <div className="modal-form">
          <p className="confirm-message">
            Add remark for status change: <strong>{pendingStatusChange?.from}</strong> {'->'}{' '}
            <strong>{pendingStatusChange?.to}</strong>
          </p>
          <textarea
            rows={4}
            placeholder="Write reason/remark..."
            value={statusRemarkText}
            onChange={(e) => setStatusRemarkText(e.target.value)}
          />
          <div className="row-actions">
            <button onClick={confirmStatusChange} disabled={!statusRemarkText.trim()}>
              Save Remark
            </button>
          </div>
        </div>
      </FormModal>
      <FormModal
        open={Boolean(pendingBulkStatus)}
        title="Bulk Status Change Remark"
        onClose={() => setPendingBulkStatus(null)}
      >
        <div className="modal-form">
          <p className="confirm-message">
            Add one remark for all selected employees moving to <strong>{pendingBulkStatus?.to}</strong>.
          </p>
          <textarea
            rows={4}
            placeholder="Write reason/remark..."
            value={statusRemarkText}
            onChange={(e) => setStatusRemarkText(e.target.value)}
          />
          <div className="row-actions">
            <button onClick={confirmBulkStatusChange} disabled={!statusRemarkText.trim()}>
              Save Remark
            </button>
          </div>
        </div>
      </FormModal>
    </section>
  )
}

function EmployeeDetailPage() {
  const params = useParams()
  const employee = params.id ? getEmployeeById(params.id) : null

  if (!employee) {
    return (
      <section>
        <h1>Employee not found</h1>
        <p>This record is not available in your role scope.</p>
      </section>
    )
  }

  return (
    <section>
      <h1>{employee.name}</h1>
      <p>Branch: {employee.branch}</p>
      <p>Assigned Agent: {employee.assignedAgent}</p>
      <p>Status: {employee.status}</p>
      <p>Email: {employee.email}</p>
      <p>
        <Link to="/employees">Back to employees</Link>
      </p>
    </section>
  )
}

function ClientsPage() {
  const [clients, setClients] = useState(() => getScopedEmployees())
  const role = getCurrentRole()
  const canManage = role === 'admin' || role === 'manager'
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingClient, setEditingClient] = useState<ReturnType<typeof getScopedEmployees>[number] | null>(null)
  const [draft, setDraft] = useState({
    name: '',
    email: '',
    branch: role === 'manager' ? 'Branch Nord' : 'Branch Nord',
    assignedAgent: 'Marco Rossi',
    status: 'Active' as 'Active' | 'Pending' | 'Inactive',
  })
  const { rows, totalPages, safePage } = paginate(clients, page)
  const { selectedIds, setSelectedIds, toggleOne, toggleAll, isAllSelected } = useBulkSelection(
    rows.map((item) => item.id),
  )

  function confirmDelete() {
    if (!canManage || !deleteId) return
    deleteEmployee(deleteId)
    setDeleteId(null)
    setClients(getScopedEmployees())
    setPage(1)
  }

  function handleCreateClient() {
    if (!canManage || !draft.name.trim() || !draft.email.trim()) return
    createEmployee({
      name: draft.name.trim(),
      email: draft.email.trim(),
      role: 'Employee',
      branch: role === 'manager' ? 'Branch Nord' : draft.branch,
      assignedAgent: draft.assignedAgent,
      status: draft.status,
    })
    setShowCreateModal(false)
    setDraft({
      name: '',
      email: '',
      branch: role === 'manager' ? 'Branch Nord' : 'Branch Nord',
      assignedAgent: 'Marco Rossi',
      status: 'Active',
    })
    setClients(getScopedEmployees())
  }

  function openEditClient(id: string) {
    const client = clients.find((item) => item.id === id)
    if (!client) return
    setEditingClient(client)
    setDraft({
      name: client.name,
      email: client.email,
      branch: client.branch,
      assignedAgent: client.assignedAgent,
      status: client.status,
    })
  }

  function saveEditClient() {
    if (!editingClient || !draft.name.trim() || !draft.email.trim()) return
    updateEmployee(editingClient.id, {
      name: draft.name.trim(),
      email: draft.email.trim(),
      branch: role === 'manager' ? 'Branch Nord' : draft.branch,
      assignedAgent: draft.assignedAgent,
      status: draft.status,
    })
    setEditingClient(null)
    setClients(getScopedEmployees())
  }
  return (
    <section>
      <h1>Clients</h1>
      <p>{clients.length} client records in your {role} scope.</p>
      {canManage ? (
        <div className="row-actions" style={{ marginTop: 12 }}>
          <button onClick={() => setShowCreateModal(true)}>➕ Add Client</button>
        </div>
      ) : null}
      {selectedIds.length > 0 ? (
        <div className="bulk-bar">
          <span>{selectedIds.length} selected</span>
          <div className="row-actions">
            <button onClick={() => setSelectedIds([])}>Clear Selection</button>
          </div>
        </div>
      ) : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => toggleAll(e.target.checked)}
                />
              </th>
              <th>SL</th>
              <th>Client</th>
              <th>Email</th>
              <th>Branch</th>
              <th>Assigned Agent</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((client, idx) => (
              <tr key={client.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(client.id)}
                    onChange={() => toggleOne(client.id)}
                  />
                </td>
                <td>{(safePage - 1) * PAGE_SIZE + idx + 1}</td>
                <td>{client.name}</td>
                <td>{client.email}</td>
                <td>{client.branch}</td>
                <td>{client.assignedAgent}</td>
                <td>{client.status}</td>
                <td>
                  {canManage ? (
                    <div className="row-actions">
                      <ActionIconButton icon="✏️" label="Edit client" onClick={() => openEditClient(client.id)} />
                      <ActionIconButton icon="🗑️" label="Delete client" onClick={() => setDeleteId(client.id)} />
                    </div>
                  ) : (
                    <span className="muted">Limited</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePager page={safePage} totalPages={totalPages} onChange={setPage} />
      <ConfirmModal
        open={Boolean(deleteId)}
        title="Delete Client"
        message="Delete this client record?"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
      <FormModal open={showCreateModal} title="Add Client" onClose={() => setShowCreateModal(false)}>
        <div className="modal-form">
          <input value={draft.name} placeholder="Client Name" onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} />
          <input value={draft.email} placeholder="Email" onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))} />
          <select value={draft.branch} disabled={role === 'manager'} onChange={(e) => setDraft((p) => ({ ...p, branch: e.target.value }))}>
            {BRANCH_OPTIONS.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
          <select value={draft.assignedAgent} onChange={(e) => setDraft((p) => ({ ...p, assignedAgent: e.target.value }))}>
            {AGENTS_BY_BRANCH[draft.branch]?.map((agent) => (
              <option key={agent} value={agent}>
                {agent}
              </option>
            ))}
          </select>
          <select value={draft.status} onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value as 'Active' | 'Pending' | 'Inactive' }))}>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Inactive">Inactive</option>
          </select>
          <div className="row-actions">
            <button onClick={handleCreateClient}>Save</button>
          </div>
        </div>
      </FormModal>
      <FormModal open={Boolean(editingClient)} title="Edit Client" onClose={() => setEditingClient(null)}>
        <div className="modal-form">
          <input value={draft.name} placeholder="Client Name" onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} />
          <input value={draft.email} placeholder="Email" onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))} />
          <select value={draft.branch} disabled={role === 'manager'} onChange={(e) => setDraft((p) => ({ ...p, branch: e.target.value }))}>
            {BRANCH_OPTIONS.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
          <select value={draft.assignedAgent} onChange={(e) => setDraft((p) => ({ ...p, assignedAgent: e.target.value }))}>
            {AGENTS_BY_BRANCH[draft.branch]?.map((agent) => (
              <option key={agent} value={agent}>
                {agent}
              </option>
            ))}
          </select>
          <select value={draft.status} onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value as 'Active' | 'Pending' | 'Inactive' }))}>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Inactive">Inactive</option>
          </select>
          <div className="row-actions">
            <button onClick={saveEditClient}>Save</button>
          </div>
        </div>
      </FormModal>
    </section>
  )
}

function LeadsPage() {
  const role = getCurrentRole()
  const user = getSessionUser()
  const canManage = role === 'admin' || role === 'manager'
  const [leads, setLeads] = useState(() => getLeads())
  const [page, setPage] = useState(1)
  const [draft, setDraft] = useState({
    company: '',
    branch: role === 'manager' ? 'Branch Nord' : 'Branch Nord',
    assignedAgent: 'Marco Rossi',
    serviceType: 'immigration',
    contractValue: '',
    stage: 'New' as LeadStage,
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingLead, setEditingLead] = useState<DemoLead | null>(null)
  const [deleteLeadId, setDeleteLeadId] = useState<string | null>(null)
  const [timelineLead, setTimelineLead] = useState<DemoLead | null>(null)
  const [statusRemarkText, setStatusRemarkText] = useState('')
  const [pendingStageChange, setPendingStageChange] = useState<null | {
    id: string
    from: LeadStage
    to: LeadStage
  }>(null)
  const [pendingBulkStage, setPendingBulkStage] = useState<null | { to: LeadStage }>(null)

  const scopedRows =
    role === 'employee'
      ? leads.filter((lead) => lead.assignedAgent === (user?.name ?? ''))
      : leads
  const { rows, totalPages, safePage } = paginate(scopedRows, page)
  const {
    selectedIds,
    setSelectedIds,
    toggleOne,
    toggleAll,
    isAllSelected,
  } = useBulkSelection(rows.map((item) => item.id))

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages))
  }, [totalPages])

  function refreshLeads() {
    setLeads(getLeads())
  }

  function handleCreateLead() {
    if (!canManage || !draft.company.trim()) return
    const branch = role === 'manager' ? 'Branch Nord' : draft.branch
    createLead({
      company: draft.company.trim(),
      branch,
      assignedAgent: draft.assignedAgent,
      serviceType: draft.serviceType,
      stage: draft.stage,
      contractValue: draft.contractValue ? Number(draft.contractValue) : null,
      stageAgeDays: 0,
    })
    setDraft((prev) => ({ ...prev, company: '', contractValue: '' }))
    setShowCreateModal(false)
    refreshLeads()
  }

  function handleDeleteLead(id: string) {
    if (!canManage) return
    setDeleteLeadId(id)
  }

  function confirmDeleteLead() {
    if (!canManage || !deleteLeadId) return
    deleteLead(deleteLeadId)
    setDeleteLeadId(null)
    refreshLeads()
  }

  function handleUpdateStage(id: string, stage: LeadStage) {
    const row = leads.find((item) => item.id === id)
    if (!row || row.stage === stage) return
    setPendingStageChange({ id, from: row.stage, to: stage })
    setStatusRemarkText('')
  }

  function openEditLead(id: string) {
    const item = leads.find((lead) => lead.id === id)
    if (!item || !canManage) return
    setEditingLead({ ...item })
  }

  function handleSaveLeadEdit() {
    if (!canManage || !editingLead) return
    updateLead(editingLead.id, {
      company: editingLead.company,
      branch: role === 'manager' ? 'Branch Nord' : editingLead.branch,
      assignedAgent: editingLead.assignedAgent,
      stage: editingLead.stage,
      serviceType: editingLead.serviceType,
      contractValue: editingLead.contractValue,
    })
    setEditingLead(null)
    refreshLeads()
  }

  function handleBulkDelete() {
    if (!canManage || selectedIds.length === 0) return
    selectedIds.forEach((id) => deleteLead(id))
    setSelectedIds([])
    refreshLeads()
  }

  function handleBulkStage(stage: LeadStage) {
    if (selectedIds.length === 0) return
    setPendingBulkStage({ to: stage })
    setStatusRemarkText('')
  }

  function getTimelineEvents(lead: DemoLead) {
    const base = [
      { label: 'Lead created', time: `${lead.stageAgeDays + 12} days ago` },
      { label: 'Assigned to agent', time: `${lead.stageAgeDays + 10} days ago` },
      { label: `Service mapped: ${lead.serviceType}`, time: `${lead.stageAgeDays + 8} days ago` },
    ]
    const stageMap: Record<LeadStage, string[]> = {
      New: ['Initial contact queued'],
      Contacted: ['First outreach completed', 'Client requested details'],
      'Proposal Sent': ['Commercial proposal generated', 'Proposal sent via email'],
      Negotiation: ['Negotiation call completed', 'Discount/terms under review'],
      Won: ['Deal marked won', 'Commission pipeline updated'],
      Lost: ['Lead marked lost', 'Reason documented by agent'],
    }
    const stageEvents = stageMap[lead.stage].map((label, idx) => ({
      label,
      time: `${Math.max(1, lead.stageAgeDays - idx)} days ago`,
    }))
    const remarks = getStatusRemarks('lead', lead.id).slice(0, 4).map((item) => ({
      label: `Remark (${item.from} -> ${item.to}): ${item.remark}`,
      time: item.at,
    }))
    const final = [{ label: `Current stage: ${lead.stage}`, time: 'Now' }]
    return [...base, ...stageEvents, ...remarks, ...final]
  }

  function confirmStageChange() {
    if (!pendingStageChange || !statusRemarkText.trim()) return
    updateLead(pendingStageChange.id, { stage: pendingStageChange.to, stageAgeDays: 0 })
    addStatusRemark({
      entity: 'lead',
      entityId: pendingStageChange.id,
      from: pendingStageChange.from,
      to: pendingStageChange.to,
      remark: statusRemarkText.trim(),
      by: user?.name ?? 'Unknown',
    })
    setPendingStageChange(null)
    setStatusRemarkText('')
    refreshLeads()
  }

  function confirmBulkStageChange() {
    if (!pendingBulkStage || !statusRemarkText.trim()) return
    selectedIds.forEach((id) => {
      const row = leads.find((item) => item.id === id)
      if (!row || row.stage === pendingBulkStage.to) return
      updateLead(id, { stage: pendingBulkStage.to, stageAgeDays: 0 })
      addStatusRemark({
        entity: 'lead',
        entityId: id,
        from: row.stage,
        to: pendingBulkStage.to,
        remark: statusRemarkText.trim(),
        by: user?.name ?? 'Unknown',
      })
    })
    setSelectedIds([])
    setPendingBulkStage(null)
    setStatusRemarkText('')
    refreshLeads()
  }

  return (
    <section>
      <h1>Leads</h1>
      <p>{scopedRows.length} leads visible in your scope.</p>
      {canManage ? (
        <div className="row-actions" style={{ marginTop: 12 }}>
          <button onClick={() => setShowCreateModal(true)}>➕ Add Lead</button>
        </div>
      ) : null}
      {selectedIds.length > 0 ? (
        <div className="bulk-bar">
          <span>{selectedIds.length} selected</span>
          <div className="row-actions">
            <button onClick={() => handleBulkStage('Contacted')}>Bulk Contacted</button>
            <button onClick={() => handleBulkStage('Negotiation')}>Bulk Negotiation</button>
            <button onClick={() => handleBulkStage('Won')}>Bulk Won</button>
            {canManage ? <button onClick={handleBulkDelete}>Bulk Delete</button> : null}
          </div>
        </div>
      ) : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => toggleAll(e.target.checked)}
                />
              </th>
              <th>SL</th>
              <th>Company</th>
              <th>Stage</th>
              <th>Service</th>
              <th>Value</th>
              <th>Agent</th>
              <th>Age</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((lead, idx) => (
              <tr key={lead.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(lead.id)}
                    onChange={() => toggleOne(lead.id)}
                  />
                </td>
                <td>{(safePage - 1) * PAGE_SIZE + idx + 1}</td>
                <td>{lead.company}</td>
                <td>
                  <select
                    value={lead.stage}
                    onChange={(e) => handleUpdateStage(lead.id, e.target.value as LeadStage)}
                  >
                    {['New', 'Contacted', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'].map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{lead.serviceType}</td>
                <td>{lead.contractValue ? `€${lead.contractValue.toLocaleString()}` : '-'}</td>
                <td>{lead.assignedAgent}</td>
                <td>{lead.stageAgeDays}d</td>
                <td>
                  <div className="row-actions">
                    <ActionIconButton icon="🪄" label="Lead timeline" onClick={() => setTimelineLead(lead)} />
                    {canManage ? (
                      <>
                        <ActionIconButton icon="✏️" label="Edit lead" onClick={() => openEditLead(lead.id)} />
                        <ActionIconButton icon="🗑️" label="Delete lead" onClick={() => handleDeleteLead(lead.id)} />
                      </>
                    ) : (
                      <span className="muted">Status only</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePager page={safePage} totalPages={totalPages} onChange={setPage} />
      <FormModal open={showCreateModal} title="Add Lead" onClose={() => setShowCreateModal(false)}>
        <div className="modal-form">
          <input
            placeholder="Company"
            value={draft.company}
            onChange={(e) => setDraft((prev) => ({ ...prev, company: e.target.value }))}
          />
          <select
            value={draft.branch}
            disabled={role === 'manager'}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                branch: e.target.value,
                assignedAgent: AGENTS_BY_BRANCH[e.target.value]?.[0] ?? prev.assignedAgent,
              }))
            }
          >
            {BRANCH_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={draft.assignedAgent}
            onChange={(e) => setDraft((prev) => ({ ...prev, assignedAgent: e.target.value }))}
          >
            {(AGENTS_BY_BRANCH[role === 'manager' ? 'Branch Nord' : draft.branch] ?? []).map((agent) => (
              <option key={agent} value={agent}>
                {agent}
              </option>
            ))}
          </select>
          <input
            placeholder="Service Type"
            value={draft.serviceType}
            onChange={(e) => setDraft((prev) => ({ ...prev, serviceType: e.target.value }))}
          />
          <select
            value={draft.stage}
            onChange={(e) => setDraft((prev) => ({ ...prev, stage: e.target.value as LeadStage }))}
          >
            {['New', 'Contacted', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'].map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
          <input
            placeholder="Value"
            type="number"
            value={draft.contractValue}
            onChange={(e) => setDraft((prev) => ({ ...prev, contractValue: e.target.value }))}
          />
          <div className="row-actions">
            <button onClick={handleCreateLead}>Save</button>
          </div>
        </div>
      </FormModal>
      <FormModal open={Boolean(editingLead)} title="Edit Lead" onClose={() => setEditingLead(null)}>
        {editingLead ? (
          <div className="modal-form">
            <input
              placeholder="Company"
              value={editingLead.company}
              onChange={(e) => setEditingLead((prev) => (prev ? { ...prev, company: e.target.value } : prev))}
            />
            <select
              value={editingLead.branch}
              disabled={role === 'manager'}
              onChange={(e) =>
                setEditingLead((prev) =>
                  prev
                    ? {
                        ...prev,
                        branch: e.target.value,
                        assignedAgent: AGENTS_BY_BRANCH[e.target.value]?.[0] ?? prev.assignedAgent,
                      }
                    : prev,
                )
              }
            >
              {BRANCH_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={editingLead.assignedAgent}
              onChange={(e) =>
                setEditingLead((prev) => (prev ? { ...prev, assignedAgent: e.target.value } : prev))
              }
            >
              {(AGENTS_BY_BRANCH[role === 'manager' ? 'Branch Nord' : editingLead.branch] ?? []).map((agent) => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </select>
            <input
              placeholder="Service Type"
              value={editingLead.serviceType}
              onChange={(e) =>
                setEditingLead((prev) => (prev ? { ...prev, serviceType: e.target.value } : prev))
              }
            />
            <select
              value={editingLead.stage}
              onChange={(e) => setEditingLead((prev) => (prev ? { ...prev, stage: e.target.value as LeadStage } : prev))}
            >
              {['New', 'Contacted', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'].map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
            <input
              placeholder="Value"
              type="number"
              value={editingLead.contractValue ?? ''}
              onChange={(e) =>
                setEditingLead((prev) =>
                  prev ? { ...prev, contractValue: e.target.value ? Number(e.target.value) : null } : prev,
                )
              }
            />
            <div className="row-actions">
              <button onClick={handleSaveLeadEdit}>Save</button>
            </div>
          </div>
        ) : null}
      </FormModal>
      <ConfirmModal
        open={Boolean(deleteLeadId)}
        title="Delete Lead"
        message="Delete this lead from the CRM pipeline?"
        onCancel={() => setDeleteLeadId(null)}
        onConfirm={confirmDeleteLead}
      />
      <FormModal
        open={Boolean(timelineLead)}
        title={timelineLead ? `Timeline — ${timelineLead.company}` : 'Lead Timeline'}
        onClose={() => setTimelineLead(null)}
      >
        {timelineLead ? (
          <ul className="timeline-list">
            {getTimelineEvents(timelineLead).map((event, idx) => (
              <li key={`${event.label}-${idx}`}>
                <span className="timeline-dot" />
                <div>
                  <p>{event.label}</p>
                  <small>{event.time}</small>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </FormModal>
      <FormModal
        open={Boolean(pendingStageChange)}
        title="Stage Change Remark"
        onClose={() => setPendingStageChange(null)}
      >
        <div className="modal-form">
          <p className="confirm-message">
            Add remark for stage change: <strong>{pendingStageChange?.from}</strong> {'->'}{' '}
            <strong>{pendingStageChange?.to}</strong>
          </p>
          <textarea
            rows={4}
            placeholder="Write reason/remark..."
            value={statusRemarkText}
            onChange={(e) => setStatusRemarkText(e.target.value)}
          />
          <div className="row-actions">
            <button onClick={confirmStageChange} disabled={!statusRemarkText.trim()}>
              Save Remark
            </button>
          </div>
        </div>
      </FormModal>
      <FormModal
        open={Boolean(pendingBulkStage)}
        title="Bulk Stage Change Remark"
        onClose={() => setPendingBulkStage(null)}
      >
        <div className="modal-form">
          <p className="confirm-message">
            Add one remark for all selected leads moving to <strong>{pendingBulkStage?.to}</strong>.
          </p>
          <textarea
            rows={4}
            placeholder="Write reason/remark..."
            value={statusRemarkText}
            onChange={(e) => setStatusRemarkText(e.target.value)}
          />
          <div className="row-actions">
            <button onClick={confirmBulkStageChange} disabled={!statusRemarkText.trim()}>
              Save Remark
            </button>
          </div>
        </div>
      </FormModal>
    </section>
  )
}

function PipelinePage() {
  const { t } = useTranslation()
  const [leads, setLeads] = useState<DemoLead[]>(() => getLeads())
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null)
  const columns: Array<{ title: string; stage: LeadStage }> = [
    { title: 'New', stage: 'New' },
    { title: 'Contacted', stage: 'Contacted' },
    { title: 'Proposal Sent', stage: 'Proposal Sent' },
    { title: 'Negotiation', stage: 'Negotiation' },
    { title: 'Won', stage: 'Won' },
    { title: 'Lost', stage: 'Lost' },
  ]

  useEffect(() => {
    setLeads(getLeads())
  }, [])

  function moveLeadToStage(leadId: string, nextStage: LeadStage) {
    const lead = leads.find((l) => l.id === leadId)
    if (!lead || lead.stage === nextStage) return
    setLeads((prev) =>
      prev.map((item) => (item.id === leadId ? { ...item, stage: nextStage, stageAgeDays: 0 } : item)),
    )
    updateLead(leadId, { stage: nextStage, stageAgeDays: 0 })
  }

  function handleDropToColumn(stage: LeadStage) {
    if (!draggingLeadId) return
    moveLeadToStage(draggingLeadId, stage)
    setDraggingLeadId(null)
  }

  const wonLeads = leads.filter((l) => l.stage === 'Won')
  const revenue = wonLeads.reduce((s, l) => s + (l.contractValue ?? 0), 0)
  const conversion = leads.length > 0 ? (wonLeads.length / leads.length) * 100 : 0

  return (
    <section className="pipeline-page">
      <h1>Pipeline</h1>
      <p>Drag and drop leads between columns to update status.</p>
      <div className="pipeline-kpis">
        <div className="pipeline-kpi">
          <small>{t('revenue')}</small>
          <strong>€{revenue.toLocaleString()}</strong>
        </div>
        <div className="pipeline-kpi">
          <small>{t('deals')}</small>
          <strong>{wonLeads.length}</strong>
        </div>
        <div className="pipeline-kpi">
          <small>{t('conversionRate')}</small>
          <strong>{conversion.toFixed(1)}%</strong>
        </div>
      </div>
      <section className="kanban-board">
        {columns.map((column) => {
          const items = leads.filter((lead) => lead.stage === column.stage)
          const columnValue = items.reduce((sum, item) => sum + (item.contractValue ?? 0), 0)
          return (
            <article
              key={column.stage}
              className="kanban-col glass"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDropToColumn(column.stage)}
            >
              <header className="kanban-col-head">
                <h3>{column.title}</h3>
                <span className="kanban-count">{items.length}</span>
              </header>
              <p className="kanban-value">€{columnValue.toLocaleString()}</p>
              <div className="kanban-cards">
                {items.length === 0 ? (
                  <div className="kanban-empty">Drop lead here</div>
                ) : (
                  items.map((item) => (
                    <article
                      key={item.id}
                      className={`kanban-card ${draggingLeadId === item.id ? 'is-dragging' : ''}`}
                      draggable
                      onDragStart={() => setDraggingLeadId(item.id)}
                      onDragEnd={() => setDraggingLeadId(null)}
                    >
                      <div className="kanban-card-top">
                        <strong>{item.company}</strong>
                        <span>{item.serviceType}</span>
                      </div>
                      <div className="kanban-card-meta">
                        <small>{item.assignedAgent}</small>
                        <small>{item.stageAgeDays}d</small>
                      </div>
                      <div className="kanban-card-value">
                        {item.contractValue ? `€${item.contractValue.toLocaleString()}` : 'No value'}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </article>
          )
        })}
      </section>
    </section>
  )
}

function ReportsPage() {
  const role = getCurrentRole()
  const canManage = role === 'admin' || role === 'manager'
  const [reports, setReports] = useState(() => getReports())
  const [page, setPage] = useState(1)
  const { rows, totalPages, safePage } = paginate(reports, page)
  const { selectedIds, setSelectedIds, toggleOne, toggleAll, isAllSelected } = useBulkSelection(
    rows.map((item) => item.id),
  )
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null)
  const [editingReportId, setEditingReportId] = useState<string | null>(null)
  const [draft, setDraft] = useState({
    id: '',
    agent: 'Marco Rossi',
    client: '',
    serviceType: 'Immigration Renewal',
    status: 'Submitted',
  })

  function openCreate() {
    setDraft({ id: '', agent: 'Marco Rossi', client: '', serviceType: 'Immigration Renewal', status: 'Submitted' })
    setShowCreateModal(true)
  }

  function saveCreate() {
    if (!draft.client.trim()) return
    createReport({
      agent: draft.agent,
      client: draft.client.trim(),
      branch: role === 'manager' ? 'Branch Nord' : 'Branch Nord',
      serviceType: draft.serviceType,
      submittedOn: new Date().toISOString().slice(0, 10),
      status: draft.status as 'Draft' | 'Submitted' | 'Under Review' | 'Accepted' | 'Rejected',
      reviewedBy: draft.status === 'Accepted' ? 'Roberto Marino' : undefined,
    })
    setReports(getReports())
    setShowCreateModal(false)
  }

  function openEdit(id: string) {
    const row = reports.find((item) => item.id === id)
    if (!row) return
    setEditingReportId(id)
    setDraft({
      id: row.id,
      agent: row.agent,
      client: row.client,
      serviceType: row.serviceType,
      status: row.status,
    })
  }

  function saveEdit() {
    if (!editingReportId) return
    updateReport(editingReportId, {
      agent: draft.agent,
      client: draft.client,
      serviceType: draft.serviceType,
      status: draft.status as 'Draft' | 'Submitted' | 'Under Review' | 'Accepted' | 'Rejected',
    })
    setReports(getReports())
    setEditingReportId(null)
  }

  function confirmDelete() {
    if (!deleteReportId) return
    deleteReport(deleteReportId)
    setReports(getReports())
    setDeleteReportId(null)
  }

  return (
    <section>
      <h1>Reports</h1>
      <p>{reports.length} reports in your scope.</p>
      {canManage ? (
        <div className="row-actions" style={{ marginTop: 12 }}>
          <button onClick={openCreate}>➕ Add Report</button>
        </div>
      ) : null}
      {selectedIds.length > 0 ? (
        <div className="bulk-bar">
          <span>{selectedIds.length} selected</span>
          <div className="row-actions">
            <button onClick={() => setSelectedIds([])}>Clear Selection</button>
          </div>
        </div>
      ) : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => toggleAll(e.target.checked)}
                />
              </th>
              <th>SL</th>
              <th>ID</th>
              <th>Agent</th>
              <th>Client</th>
              <th>Service</th>
              <th>Status</th>
              <th>Reviewed By</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((report, idx) => (
              <tr key={report.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(report.id)}
                    onChange={() => toggleOne(report.id)}
                  />
                </td>
                <td>{(safePage - 1) * PAGE_SIZE + idx + 1}</td>
                <td>{report.id}</td>
                <td>{report.agent}</td>
                <td>{report.client}</td>
                <td>{report.serviceType}</td>
                <td>{report.status}</td>
                <td>{report.reviewedBy ?? '-'}</td>
                <td>
                  {canManage ? (
                    <div className="row-actions">
                      <ActionIconButton icon="✏️" label="Edit report" onClick={() => openEdit(report.id)} />
                      <ActionIconButton icon="🗑️" label="Delete report" onClick={() => setDeleteReportId(report.id)} />
                    </div>
                  ) : (
                    <span className="muted">Limited</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePager page={safePage} totalPages={totalPages} onChange={setPage} />
      <FormModal open={showCreateModal || Boolean(editingReportId)} title={editingReportId ? 'Edit Report' : 'Add Report'} onClose={() => { setShowCreateModal(false); setEditingReportId(null) }}>
        <div className="modal-form">
          <input value={draft.client} placeholder="Client" onChange={(e) => setDraft((p) => ({ ...p, client: e.target.value }))} />
          <input value={draft.agent} placeholder="Agent" onChange={(e) => setDraft((p) => ({ ...p, agent: e.target.value }))} />
          <input value={draft.serviceType} placeholder="Service" onChange={(e) => setDraft((p) => ({ ...p, serviceType: e.target.value }))} />
          <select value={draft.status} onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value }))}>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>
          <div className="row-actions">
            <button onClick={editingReportId ? saveEdit : saveCreate}>Save</button>
          </div>
        </div>
      </FormModal>
      <ConfirmModal
        open={Boolean(deleteReportId)}
        title="Delete Report"
        message="Are you sure you want to delete this report?"
        onCancel={() => setDeleteReportId(null)}
        onConfirm={confirmDelete}
      />
    </section>
  )
}

function NewReportPage() {
  const role = getCurrentRole()
  return (
    <section>
      <h1>New Report</h1>
      <p>
        Demo-only entry point for report submission. Current role: <strong>{role}</strong>.
      </p>
      <div className="chart-card glass">
        <h3>Submission checklist</h3>
        <ul className="feed">
          <li>
            <span className="dot dot-create" />
            <span>Select client and service type</span>
            <small>Required</small>
          </li>
          <li>
            <span className="dot dot-update" />
            <span>Attach supporting documents</span>
            <small>Required</small>
          </li>
          <li>
            <span className="dot dot-stage" />
            <span>Submit to branch manager review</span>
            <small>Workflow</small>
          </li>
        </ul>
      </div>
    </section>
  )
}

function CommissionsPage() {
  const { t } = useTranslation()
  const role = getCurrentRole()
  const canManage = role === 'admin'
  const [commissions, setCommissions] = useState(() => getCommissions())
  const [page, setPage] = useState(1)
  const { rows, totalPages, safePage } = paginate(commissions, page)
  const { selectedIds, setSelectedIds, toggleOne, toggleAll, isAllSelected } = useBulkSelection(
    rows.map((item) => item.id),
  )
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [rules, setRules] = useState(() => getRules())
  const [calcMessage, setCalcMessage] = useState('')
  const [draft, setDraft] = useState({
    agent: 'Marco Rossi',
    branch: 'Branch Nord',
    deal: '',
    service: 'Tax',
    gross: '',
    rate: '10',
    status: 'Pending',
    date: new Date().toISOString().slice(0, 10),
  })
  const total = commissions.reduce((sum, c) => sum + c.amount, 0)

  function persist(next: typeof commissions) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ems_commissions', JSON.stringify(next))
    }
    setCommissions(next)
  }

  function confirmDelete() {
    if (!deleteId) return
    persist(commissions.filter((item) => item.id !== deleteId))
    setDeleteId(null)
  }

  function handleRun() {
    const created = runCommissionCalculation()
    setCommissions(getCommissions())
    setCalcMessage(
      created > 0
        ? `Created ${created} new commission${created === 1 ? '' : 's'} from closed deals.`
        : 'No new commissions. All closed deals already have entries.',
    )
    setTimeout(() => setCalcMessage(''), 4000)
  }

  function handleSaveRules() {
    saveRules(rules)
    setRulesOpen(false)
  }

  function openCreate() {
    setEditingId(null)
    setDraft({
      agent: 'Marco Rossi',
      branch: 'Branch Nord',
      deal: '',
      service: 'Tax',
      gross: '',
      rate: '10',
      status: 'Pending',
      date: new Date().toISOString().slice(0, 10),
    })
    setShowForm(true)
  }

  function openEdit(id: string) {
    const row = commissions.find((item) => item.id === id)
    if (!row) return
    setEditingId(id)
    setDraft({
      agent: row.agent,
      branch: row.branch,
      deal: row.deal,
      service: row.service,
      gross: String(row.gross),
      rate: String(row.rate),
      status: row.status,
      date: row.date,
    })
    setShowForm(true)
  }

  function saveCommission() {
    const gross = Number(draft.gross)
    const rate = Number(draft.rate)
    if (!draft.deal.trim() || !Number.isFinite(gross) || !Number.isFinite(rate)) return
    const amount = Math.round((gross * rate) / 100)
    if (editingId) {
      const next = commissions.map((item) =>
        item.id === editingId
          ? {
              ...item,
              agent: draft.agent,
              branch: draft.branch,
              deal: draft.deal.trim(),
              service: draft.service,
              gross,
              rate,
              amount,
              date: draft.date,
              status: draft.status as 'Pending' | 'Approved' | 'Paid' | 'Disputed',
            }
          : item,
      )
      persist(next)
    } else {
      const row = {
        id: `COMM-${Date.now()}`,
        agent: draft.agent,
        branch: draft.branch,
        deal: draft.deal.trim(),
        service: draft.service,
        gross,
        rate,
        amount,
        date: draft.date,
        status: draft.status as 'Pending' | 'Approved' | 'Paid' | 'Disputed',
      }
      persist([row, ...commissions])
    }
    setShowForm(false)
    setEditingId(null)
  }

  function handleExportCsv() {
    exportCsv('commissions', commissions as unknown as Record<string, unknown>[])
  }

  return (
    <section>
      <h1>Commissions</h1>
      <p>
        {commissions.length} records in scope • Total €{total.toLocaleString()}
      </p>
      {calcMessage ? <p className="calc-banner">{calcMessage}</p> : null}
      {canManage ? (
        <div className="row-actions" style={{ marginTop: 12 }}>
          <button onClick={openCreate}>➕ Add Commission</button>
          <button onClick={handleRun}>⚡ {t('runCalculation')}</button>
          <button onClick={() => setRulesOpen(true)}>⚙ {t('commissionRules')}</button>
          <button onClick={handleExportCsv}>⇣ {t('exportCsv')}</button>
        </div>
      ) : null}
      {selectedIds.length > 0 ? (
        <div className="bulk-bar">
          <span>{selectedIds.length} selected</span>
          <div className="row-actions">
            <button onClick={() => setSelectedIds([])}>Clear Selection</button>
          </div>
        </div>
      ) : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => toggleAll(e.target.checked)}
                />
              </th>
              <th>SL</th>
              <th>ID</th>
              <th>Agent</th>
              <th>Deal</th>
              <th>Status</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((commission, idx) => (
              <tr key={commission.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(commission.id)}
                    onChange={() => toggleOne(commission.id)}
                  />
                </td>
                <td>{(safePage - 1) * PAGE_SIZE + idx + 1}</td>
                <td>{commission.id}</td>
                <td>{commission.agent}</td>
                <td>{commission.deal}</td>
                <td>{commission.status}</td>
                <td>{commission.date}</td>
                <td>€{commission.amount.toLocaleString()}</td>
                <td>
                  {canManage ? (
                    <div className="row-actions">
                      <ActionIconButton icon="✏️" label="Edit commission" onClick={() => openEdit(commission.id)} />
                      <ActionIconButton icon="🗑️" label="Delete commission" onClick={() => setDeleteId(commission.id)} />
                    </div>
                  ) : (
                    <span className="muted">Limited</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePager page={safePage} totalPages={totalPages} onChange={setPage} />
      <ConfirmModal
        open={Boolean(deleteId)}
        title="Delete Commission"
        message="Delete this commission entry?"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
      <FormModal open={rulesOpen} title={t('commissionRules')} onClose={() => setRulesOpen(false)}>
        <div className="modal-form">
          <p className="muted">Set the commission percentage applied by service type when running calculations on closed deals.</p>
          {rules.map((rule, idx) => (
            <div key={rule.id} className="rule-row">
              <input
                value={rule.service}
                onChange={(e) =>
                  setRules((prev) => prev.map((r, i) => (i === idx ? { ...r, service: e.target.value } : r)))
                }
                placeholder="Service"
              />
              <input
                type="number"
                value={rule.rate}
                onChange={(e) =>
                  setRules((prev) => prev.map((r, i) => (i === idx ? { ...r, rate: Number(e.target.value) || 0 } : r)))
                }
              />
              <span>%</span>
              <button
                className="icon-action-btn"
                title="Remove rule"
                onClick={() => setRules((prev) => prev.filter((_, i) => i !== idx))}
              >
                ✕
              </button>
            </div>
          ))}
          <div className="row-actions">
            <button
              onClick={() =>
                setRules((prev) => [...prev, { id: `rule-${Date.now()}`, service: 'New Service', rate: 10 }])
              }
            >
              ＋ Add Rule
            </button>
            <button onClick={handleSaveRules}>Save</button>
          </div>
        </div>
      </FormModal>
      <FormModal open={showForm} title={editingId ? 'Edit Commission' : 'Add Commission'} onClose={() => setShowForm(false)}>
        <div className="modal-form">
          <select value={draft.agent} onChange={(e) => setDraft((p) => ({ ...p, agent: e.target.value }))}>
            {['Marco Rossi', 'Lucia Mancini', 'Paolo Conti'].map((agent) => (
              <option key={agent} value={agent}>
                {agent}
              </option>
            ))}
          </select>
          <select value={draft.branch} onChange={(e) => setDraft((p) => ({ ...p, branch: e.target.value }))}>
            {BRANCH_OPTIONS.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
          <input value={draft.deal} placeholder="Deal" onChange={(e) => setDraft((p) => ({ ...p, deal: e.target.value }))} />
          <input value={draft.service} placeholder="Service" onChange={(e) => setDraft((p) => ({ ...p, service: e.target.value }))} />
          <input type="number" value={draft.gross} placeholder="Gross" onChange={(e) => setDraft((p) => ({ ...p, gross: e.target.value }))} />
          <input type="number" value={draft.rate} placeholder="Rate %" onChange={(e) => setDraft((p) => ({ ...p, rate: e.target.value }))} />
          <input type="date" value={draft.date} onChange={(e) => setDraft((p) => ({ ...p, date: e.target.value }))} />
          <select value={draft.status} onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value }))}>
            {['Pending', 'Approved', 'Paid', 'Disputed'].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <div className="row-actions">
            <button onClick={saveCommission}>Save</button>
          </div>
        </div>
      </FormModal>
    </section>
  )
}

function PartnersPage() {
  const role = getCurrentRole()
  const canManage = role === 'admin' || role === 'manager'
  const [partners, setPartners] = useState(() => getPartners())
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState({
    name: '',
    city: '',
    status: 'Active' as 'Active' | 'Pending',
  })
  const { selectedIds, setSelectedIds, toggleOne, toggleAll, isAllSelected } = useBulkSelection(
    partners.map((item) => item.id),
  )

  function confirmDelete() {
    if (!deleteId) return
    deletePartner(deleteId)
    setPartners(getPartners())
    setDeleteId(null)
  }

  function openCreate() {
    setEditingId(null)
    setDraft({ name: '', city: '', status: 'Active' })
    setShowModal(true)
  }

  function openEdit(id: string) {
    const row = partners.find((item) => item.id === id)
    if (!row) return
    setEditingId(id)
    setDraft({ name: row.name, city: row.city, status: row.status as 'Active' | 'Pending' })
    setShowModal(true)
  }

  function savePartner() {
    if (!draft.name.trim() || !draft.city.trim()) return
    if (editingId) {
      updatePartner(editingId, { name: draft.name.trim(), city: draft.city.trim(), status: draft.status })
    } else {
      createPartner({ name: draft.name.trim(), city: draft.city.trim(), status: draft.status })
    }
    setPartners(getPartners())
    setShowModal(false)
    setEditingId(null)
  }

  return (
    <section>
      <h1>Partners</h1>
      <p>Partner agencies and referral channels.</p>
      {canManage ? (
        <div className="row-actions" style={{ marginTop: 12 }}>
          <button onClick={openCreate}>➕ Add Partner</button>
        </div>
      ) : null}
      {selectedIds.length > 0 ? (
        <div className="bulk-bar">
          <span>{selectedIds.length} selected</span>
          <div className="row-actions">
            <button onClick={() => setSelectedIds([])}>Clear Selection</button>
          </div>
        </div>
      ) : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => toggleAll(e.target.checked)}
                />
              </th>
              <th>SL</th>
              <th>ID</th>
              <th>Partner</th>
              <th>City</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((partner, idx) => (
              <tr key={partner.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(partner.id)}
                    onChange={() => toggleOne(partner.id)}
                  />
                </td>
                <td>{idx + 1}</td>
                <td>{partner.id}</td>
                <td>{partner.name}</td>
                <td>{partner.city}</td>
                <td>{partner.status}</td>
                <td>
                  {canManage ? (
                    <div className="row-actions">
                      <ActionIconButton icon="✏️" label="Edit partner" onClick={() => openEdit(partner.id)} />
                      <ActionIconButton icon="🗑️" label="Delete partner" onClick={() => setDeleteId(partner.id)} />
                    </div>
                  ) : (
                    <span className="muted">Limited</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmModal
        open={Boolean(deleteId)}
        title="Delete Partner"
        message="Delete this partner record?"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
      <FormModal open={showModal} title={editingId ? 'Edit Partner' : 'Add Partner'} onClose={() => setShowModal(false)}>
        <div className="modal-form">
          <input value={draft.name} placeholder="Partner Name" onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} />
          <input value={draft.city} placeholder="City" onChange={(e) => setDraft((p) => ({ ...p, city: e.target.value }))} />
          <select value={draft.status} onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value as 'Active' | 'Pending' }))}>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
          </select>
          <div className="row-actions">
            <button onClick={savePartner}>Save</button>
          </div>
        </div>
      </FormModal>
    </section>
  )
}

function SosSyncPage() {
  const rows = [
    { id: 'SYNC-2001', time: '14 Apr 10:00', imported: 12, pushed: 3, status: 'Success' },
    { id: 'SYNC-2000', time: '13 Apr 10:00', imported: 9, pushed: 5, status: 'Success' },
    { id: 'SYNC-1999', time: '12 Apr 10:00', imported: 0, pushed: 0, status: 'Failed' },
  ]
  const { selectedIds, setSelectedIds, toggleOne, toggleAll, isAllSelected } = useBulkSelection(
    rows.map((item) => item.id),
  )
  return (
    <section>
      <h1>SOS Sync</h1>
      <p>Legacy sync monitor for admin operations.</p>
      {selectedIds.length > 0 ? (
        <div className="bulk-bar">
          <span>{selectedIds.length} selected</span>
          <div className="row-actions">
            <button onClick={() => setSelectedIds([])}>Clear Selection</button>
          </div>
        </div>
      ) : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => toggleAll(e.target.checked)}
                />
              </th>
              <th>SL</th>
              <th>Batch</th>
              <th>Time</th>
              <th>Imported</th>
              <th>Pushed</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(row.id)}
                    onChange={() => toggleOne(row.id)}
                  />
                </td>
                <td>{idx + 1}</td>
                <td>{row.id}</td>
                <td>{row.time}</td>
                <td>{row.imported}</td>
                <td>{row.pushed}</td>
                <td>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function TasksPage() {
  const notifications = getNotifications()
  return (
    <section>
      <h1>Tasks</h1>
      <p>Action queue generated from role notifications and workflow dependencies.</p>
      <ul className="feed">
        {notifications.length === 0 ? (
          <li>
            <span className="dot dot-create" />
            <span>No pending tasks.</span>
            <small>-</small>
          </li>
        ) : (
          notifications.map((note) => (
            <li key={note.id}>
              <span className={`dot dot-${note.type === 'alert' ? 'alert' : 'update'}`} />
              <span>{note.text}</span>
              <small>{note.createdAt}</small>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}

function ProfilePage() {
  const [user, setUser] = useState(() => getSessionUser())
  const [form, setForm] = useState(() => ({
    name: user?.name ?? '',
    email: user?.email ?? '',
    branch: user?.branch ?? 'Branch Nord',
  }))
  const [saved, setSaved] = useState(false)

  function handleSave() {
    const next = updateSessionProfile(form)
    if (!next) return
    setUser(next)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1600)
  }

  return (
    <section className="profile-page">
      <h1>Profile</h1>
      <p>Manage your account details and branch visibility.</p>
      <div className="profile-grid">
        <article className="chart-card glass profile-card">
          <h3>Identity</h3>
          <div className="profile-avatar">{user?.initials ?? 'U'}</div>
          <p className="profile-name">{user?.name}</p>
          <p className="profile-meta">
            {user?.role} • {user?.branch}
          </p>
        </article>
        <article className="chart-card glass profile-card">
          <h3>Edit profile</h3>
          <div className="profile-form">
            <label>
              Full Name
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </label>
            <label>
              Email
              <input
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </label>
            <label>
              Branch
              <select
                value={form.branch}
                onChange={(e) => setForm((prev) => ({ ...prev, branch: e.target.value }))}
              >
                {BRANCH_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
                <option value="All">All</option>
              </select>
            </label>
            <div className="row-actions">
              <button onClick={handleSave}>Save Changes</button>
              {saved ? <span className="saved-pill">Saved</span> : null}
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}

function SettingsPage() {
  const navigate = useNavigate()

  function handleReset() {
    resetDemoData()
    resetAllRoleData()
    resetFinance()
    resetReporting()
    seedUsersIfMissing()
    seedEmployeesIfMissing()
    seedAllRoleData()
    seedOrgData()
    seedFinance()
    seedPartnersIfMissing()
    navigate('/login', { replace: true })
  }

  return (
    <section>
      <h1>Settings</h1>
      <p>Use reset to restore default demo users and employee data.</p>
      <button onClick={handleReset}>Reset Demo Data</button>
    </section>
  )
}

function AgentsPage() {
  const role = getCurrentRole()
  const canManage = role === 'admin' || role === 'manager'
  const user = getSessionUser()
  const [rows, setRows] = useState(() => getScopedAgents())
  const [showCreate, setShowCreate] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [draft, setDraft] = useState({
    name: '',
    email: '',
    branch: role === 'manager' ? user?.branch ?? 'Branch Nord' : 'Branch Nord',
    status: 'Active' as 'Active' | 'On Leave' | 'Inactive',
  })

  function refresh() {
    setRows(getScopedAgents())
  }

  function saveCreate() {
    if (!canManage || !draft.name.trim() || !draft.email.trim()) return
    createAgent({
      name: draft.name.trim(),
      email: draft.email.trim(),
      branch: role === 'manager' ? user?.branch ?? 'Branch Nord' : draft.branch,
      status: draft.status,
    })
    setShowCreate(false)
    setDraft((p) => ({ ...p, name: '', email: '' }))
    refresh()
  }

  function confirmDelete() {
    if (!deleteId) return
    deleteAgent(deleteId)
    setDeleteId(null)
    refresh()
  }

  return (
    <section>
      <h1>Agents</h1>
      <p>Manage sales/operation agents by branch.</p>
      {canManage ? (
        <div className="row-actions" style={{ marginTop: 12 }}>
          <button onClick={() => setShowCreate(true)}>➕ Add Agent</button>
        </div>
      ) : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>SL</th>
              <th>Name</th>
              <th>Email</th>
              <th>Branch</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id}>
                <td>{idx + 1}</td>
                <td>{row.name}</td>
                <td>{row.email}</td>
                <td>{row.branch}</td>
                <td>{row.status}</td>
                <td>
                  {canManage ? (
                    <ActionIconButton icon="🗑️" label="Delete agent" onClick={() => setDeleteId(row.id)} />
                  ) : (
                    <span className="muted">Limited</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <FormModal open={showCreate} title="Add Agent" onClose={() => setShowCreate(false)}>
        <div className="modal-form">
          <input value={draft.name} placeholder="Name" onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} />
          <input value={draft.email} placeholder="Email" onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))} />
          <select
            value={draft.branch}
            disabled={role === 'manager'}
            onChange={(e) => setDraft((p) => ({ ...p, branch: e.target.value }))}
          >
            {getBranches().map((branch) => (
              <option key={branch.id} value={branch.name}>
                {branch.name}
              </option>
            ))}
          </select>
          <select value={draft.status} onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value as 'Active' | 'On Leave' | 'Inactive' }))}>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Inactive">Inactive</option>
          </select>
          <div className="row-actions">
            <button onClick={saveCreate}>Save</button>
          </div>
        </div>
      </FormModal>
      <ConfirmModal
        open={Boolean(deleteId)}
        title="Delete Agent"
        message="Delete this agent record?"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </section>
  )
}

function BranchesPage() {
  const [rows, setRows] = useState(() => getBranches())
  const [showCreate, setShowCreate] = useState(false)
  const [draft, setDraft] = useState({
    name: '',
    city: '',
    manager: '',
    status: 'Active' as 'Active' | 'Planned',
  })

  function saveCreate() {
    if (!draft.name.trim() || !draft.city.trim() || !draft.manager.trim()) return
    createBranch({
      name: draft.name.trim(),
      city: draft.city.trim(),
      manager: draft.manager.trim(),
      status: draft.status,
    })
    setRows(getBranches())
    setShowCreate(false)
    setDraft({ name: '', city: '', manager: '', status: 'Active' })
  }

  return (
    <section>
      <h1>Branches</h1>
      <p>Admin-only branch configuration and expansion planning.</p>
      <div className="row-actions" style={{ marginTop: 12 }}>
        <button onClick={() => setShowCreate(true)}>➕ Add Branch</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>SL</th>
              <th>Name</th>
              <th>City</th>
              <th>Manager</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id}>
                <td>{idx + 1}</td>
                <td>{row.name}</td>
                <td>{row.city}</td>
                <td>{row.manager}</td>
                <td>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <FormModal open={showCreate} title="Add Branch" onClose={() => setShowCreate(false)}>
        <div className="modal-form">
          <input value={draft.name} placeholder="Branch Name" onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} />
          <input value={draft.city} placeholder="City" onChange={(e) => setDraft((p) => ({ ...p, city: e.target.value }))} />
          <input value={draft.manager} placeholder="Manager Name" onChange={(e) => setDraft((p) => ({ ...p, manager: e.target.value }))} />
          <select value={draft.status} onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value as 'Active' | 'Planned' }))}>
            <option value="Active">Active</option>
            <option value="Planned">Planned</option>
          </select>
          <div className="row-actions">
            <button onClick={saveCreate}>Save</button>
          </div>
        </div>
      </FormModal>
    </section>
  )
}

function UnifiedDbPage() {
  const { t } = useTranslation()
  const [view, setView] = useState<'partners' | 'clients'>('partners')
  const agents = getScopedAgents()
  const clients = getScopedEmployees()
  const branches = getBranches()
  const branchCounts = branches.map((b) => ({
    name: b.name,
    partners: agents.filter((a) => a.branch === b.name).length,
    clients: clients.filter((c) => c.branch === b.name).length,
  }))
  const [q, setQ] = useState('')

  const filteredPartners = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(q.toLowerCase()) ||
      a.email.toLowerCase().includes(q.toLowerCase()) ||
      a.branch.toLowerCase().includes(q.toLowerCase()),
  )
  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      (c.assignedAgent ?? '').toLowerCase().includes(q.toLowerCase()) ||
      c.branch.toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <section>
      <h1>{t('unifiedDb')}</h1>
      <p>Centralised partner and end-client records in a single secure environment.</p>

      <div className="unified-tabs">
        <button className={view === 'partners' ? 'active' : ''} onClick={() => setView('partners')}>
          {t('partnersView')} ({agents.length})
        </button>
        <button className={view === 'clients' ? 'active' : ''} onClick={() => setView('clients')}>
          {t('endClientsView')} ({clients.length})
        </button>
      </div>

      <div className="branch-counter-row">
        {branchCounts.map((b) => (
          <div key={b.name} className="branch-counter glass">
            <small>{b.name}</small>
            <div>
              <strong>{b.partners}</strong>
              <span>{t('partnersView').toLowerCase()}</span>
            </div>
            <div>
              <strong>{b.clients}</strong>
              <span>{t('endClientsView').toLowerCase()}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="row-actions" style={{ marginTop: 12 }}>
        <input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {view === 'partners' ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SL</th>
                <th>Name</th>
                <th>Email</th>
                <th>Branch</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPartners.map((row, idx) => (
                <tr key={row.id}>
                  <td>{idx + 1}</td>
                  <td>{row.name}</td>
                  <td>{row.email}</td>
                  <td>{row.branch}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SL</th>
                <th>Name</th>
                <th>Assigned Agent</th>
                <th>Branch</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((row, idx) => (
                <tr key={row.id}>
                  <td>{idx + 1}</td>
                  <td>{row.name}</td>
                  <td>{row.assignedAgent ?? '-'}</td>
                  <td>{row.branch}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function HierarchyNodeCard({ node }: { node: HierarchyNode }) {
  return (
    <div className={`hierarchy-node role-${node.role}`}>
      <div className="hierarchy-card">
        <span className={`role-pill role-${node.role}`}>{node.role}</span>
        <strong>{node.name}</strong>
        {node.meta ? <small>{node.meta}</small> : null}
      </div>
      {node.children.length > 0 ? (
        <div className="hierarchy-children">
          {node.children.map((child) => (
            <HierarchyNodeCard key={child.id} node={child} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function HierarchyPage() {
  const { t } = useTranslation()
  const tree = buildHierarchy()
  return (
    <section>
      <h1>{t('hierarchy')}</h1>
      <p>Dynamic org chart: Admin → Area Manager → Agents, with locked viewing permissions.</p>
      <div className="hierarchy-wrap">
        <HierarchyNodeCard node={tree} />
      </div>
    </section>
  )
}

function InvoicesPage() {
  const { t } = useTranslation()
  const [rows, setRows] = useState(() => getInvoices())
  const [showCreate, setShowCreate] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [draft, setDraft] = useState({
    agent: getScopedAgents()[0]?.name ?? '',
    period: new Date().toISOString().slice(0, 7),
  })

  function refresh() {
    setRows(getInvoices())
  }

  function handleCreate() {
    if (!draft.agent) return
    const invoice = generateInvoiceForAgent(draft.agent, draft.period)
    if (!invoice) {
      window.alert('No approvable commissions found for this agent.')
      return
    }
    setShowCreate(false)
    refresh()
  }

  function handleStatus(id: string, status: InvoiceStatus) {
    updateInvoiceStatus(id, status)
    refresh()
  }

  function confirmDelete() {
    if (!deleteId) return
    deleteInvoice(deleteId)
    setDeleteId(null)
    refresh()
  }

  function handleExportCsv() {
    exportCsv('invoices', rows.map((r) => ({ ...r, items: r.items.join(';') })) as unknown as Record<string, unknown>[])
  }
  function handleExportJson() {
    exportJson('invoices', rows)
  }

  const totalAmount = rows.reduce((sum, r) => sum + r.amount, 0)

  return (
    <section>
      <h1>{t('invoices')}</h1>
      <p>Proforma invoice invitations grouped by agent. {rows.length} invoices • €{totalAmount.toLocaleString()} total.</p>
      <div className="row-actions" style={{ marginTop: 12 }}>
        <button onClick={() => setShowCreate(true)}>＋ {t('generateInvoice')}</button>
        <button onClick={handleExportCsv}>⇣ {t('exportCsv')}</button>
        <button onClick={handleExportJson}>⇣ {t('exportJson')}</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>SL</th>
              <th>ID</th>
              <th>Agent</th>
              <th>Branch</th>
              <th>Period</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id}>
                <td>{idx + 1}</td>
                <td>{row.id}</td>
                <td>{row.agent}</td>
                <td>{row.branch}</td>
                <td>{row.period}</td>
                <td>{row.items.length}</td>
                <td>€{row.amount.toLocaleString()}</td>
                <td>
                  <span className={`status-pill status-${row.status.toLowerCase()}`}>{row.status}</span>
                </td>
                <td>
                  <div className="row-actions">
                    {row.status === 'Draft' ? (
                      <button onClick={() => handleStatus(row.id, 'Invited')}>Invite</button>
                    ) : null}
                    {row.status === 'Invited' ? (
                      <button onClick={() => handleStatus(row.id, 'Acknowledged')}>Acknowledge</button>
                    ) : null}
                    {row.status === 'Acknowledged' ? (
                      <button onClick={() => handleStatus(row.id, 'Paid')}>Mark Paid</button>
                    ) : null}
                    <ActionIconButton icon="🗑️" label="Delete invoice" onClick={() => setDeleteId(row.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <FormModal open={showCreate} title={t('generateInvoice')} onClose={() => setShowCreate(false)}>
        <div className="modal-form">
          <label>Agent</label>
          <select value={draft.agent} onChange={(e) => setDraft((p) => ({ ...p, agent: e.target.value }))}>
            {getScopedAgents().map((a) => (
              <option key={a.id} value={a.name}>
                {a.name}
              </option>
            ))}
          </select>
          <label>Period (YYYY-MM)</label>
          <input value={draft.period} onChange={(e) => setDraft((p) => ({ ...p, period: e.target.value }))} />
          <div className="row-actions">
            <button onClick={handleCreate}>Generate</button>
          </div>
        </div>
      </FormModal>
      <ConfirmModal
        open={Boolean(deleteId)}
        title="Delete Invoice"
        message="Remove this invoice? Any auto-posted ledger entry will remain."
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </section>
  )
}

function LedgerPage() {
  const { t } = useTranslation()
  const [rows, setRows] = useState(() => getLedger())
  const [showCreate, setShowCreate] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [draft, setDraft] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'income' as 'income' | 'expense',
    category: 'Service Fee',
    amount: 0,
    description: '',
  })

  function refresh() {
    setRows(getLedger())
  }

  function handleCreate() {
    if (draft.amount <= 0) return
    addLedgerEntry({ ...draft, source: 'manual' })
    setShowCreate(false)
    setDraft({ ...draft, amount: 0, description: '' })
    refresh()
  }

  function confirmDelete() {
    if (!deleteId) return
    deleteLedgerEntry(deleteId)
    setDeleteId(null)
    refresh()
  }

  const filtered = typeFilter === 'all' ? rows : rows.filter((r) => r.type === typeFilter)
  const totalIncome = rows.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0)
  const totalExpense = rows.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
  const cashflow = getCashFlowByMonth()

  return (
    <section>
      <h1>{t('ledger')}</h1>
      <p>Centralised company accounting register with live cash flow.</p>
      <div className="ledger-kpis">
        <div className="pipeline-kpi">
          <small>{t('income')}</small>
          <strong>€{totalIncome.toLocaleString()}</strong>
        </div>
        <div className="pipeline-kpi">
          <small>{t('expense')}</small>
          <strong>€{totalExpense.toLocaleString()}</strong>
        </div>
        <div className="pipeline-kpi">
          <small>{t('net')}</small>
          <strong>€{(totalIncome - totalExpense).toLocaleString()}</strong>
        </div>
      </div>
      <article className="chart-card glass" style={{ marginTop: 16 }}>
        <h3>{t('cashFlow')}</h3>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={cashflow}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.08} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
              <XAxis dataKey="month" stroke="#cbd5e1" />
              <YAxis stroke="#cbd5e1" />
              <Tooltip />
              <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
              <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </article>
      <div className="row-actions" style={{ marginTop: 16 }}>
        <button onClick={() => setShowCreate(true)}>＋ Add Entry</button>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'all' | 'income' | 'expense')}>
          <option value="all">All</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <button onClick={() => exportCsv('ledger', rows as unknown as Record<string, unknown>[])}>⇣ {t('exportCsv')}</button>
        <button onClick={() => exportJson('ledger', rows)}>⇣ {t('exportJson')}</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>SL</th>
              <th>Date</th>
              <th>Type</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Source</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, idx) => (
              <tr key={row.id}>
                <td>{idx + 1}</td>
                <td>{row.date}</td>
                <td>
                  <span className={`status-pill status-${row.type}`}>{row.type}</span>
                </td>
                <td>{row.category}</td>
                <td>€{row.amount.toLocaleString()}</td>
                <td>{row.description}</td>
                <td>{row.source}</td>
                <td>
                  <ActionIconButton icon="🗑️" label="Delete entry" onClick={() => setDeleteId(row.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <FormModal open={showCreate} title="Add Ledger Entry" onClose={() => setShowCreate(false)}>
        <div className="modal-form">
          <label>Date</label>
          <input type="date" value={draft.date} onChange={(e) => setDraft((p) => ({ ...p, date: e.target.value }))} />
          <label>Type</label>
          <select value={draft.type} onChange={(e) => setDraft((p) => ({ ...p, type: e.target.value as 'income' | 'expense' }))}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <label>Category</label>
          <input value={draft.category} onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value }))} />
          <label>Amount</label>
          <input type="number" value={draft.amount} onChange={(e) => setDraft((p) => ({ ...p, amount: Number(e.target.value) || 0 }))} />
          <label>Description</label>
          <input value={draft.description} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))} />
          <div className="row-actions">
            <button onClick={handleCreate}>Save</button>
          </div>
        </div>
      </FormModal>
      <ConfirmModal
        open={Boolean(deleteId)}
        title="Delete Ledger Entry"
        message="Remove this ledger entry?"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </section>
  )
}

function ReportingPage() {
  const { t } = useTranslation()
  const role = getCurrentRole()
  const [preset, setPreset] = useState<ReportPresetId>('pipeline-performance')
  const [filters, setFilters] = useState<{ branch: string; agent: string }>({ branch: 'All', agent: 'All' })
  const [views, setViews] = useState<SavedView[]>(() => getSavedViews())
  const [saveOpen, setSaveOpen] = useState(false)
  const [saveName, setSaveName] = useState('')

  const branches = getBranches()
  const agents = getScopedAgents()
  const presets: ReportPresetId[] = role === 'employee'
    ? ['agent-productivity']
    : ['pipeline-performance', 'commission-report', 'cash-flow', 'agent-productivity', 'branch-performance']

  const result = runReport(preset, filters)

  function handleSaveView() {
    if (!saveName.trim()) return
    saveView({ name: saveName.trim(), preset, filters })
    setViews(getSavedViews())
    setSaveName('')
    setSaveOpen(false)
  }

  function loadView(v: SavedView) {
    setPreset(v.preset)
    setFilters({ branch: v.filters.branch ?? 'All', agent: v.filters.agent ?? 'All' })
  }

  function removeView(id: string) {
    deleteSavedView(id)
    setViews(getSavedViews())
  }

  return (
    <section>
      <h1>{t('reportingPlatform')}</h1>
      <p>Native analytical reporting across CRM, Finance and Operations.</p>

      <div className="preset-grid">
        {presets.map((p) => (
          <button
            key={p}
            className={`preset-card ${preset === p ? 'active' : ''}`}
            onClick={() => setPreset(p)}
          >
            <strong>{PRESET_LABELS[p]}</strong>
          </button>
        ))}
      </div>

      <div className="row-actions report-filters">
        {role !== 'manager' ? (
          <select value={filters.branch} onChange={(e) => setFilters((p) => ({ ...p, branch: e.target.value }))}>
            <option value="All">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        ) : null}
        {role !== 'employee' ? (
          <select value={filters.agent} onChange={(e) => setFilters((p) => ({ ...p, agent: e.target.value }))}>
            <option value="All">All Agents</option>
            {agents.map((a) => (
              <option key={a.id} value={a.name}>
                {a.name}
              </option>
            ))}
          </select>
        ) : null}
        <button onClick={() => setSaveOpen(true)}>💾 {t('saveView')}</button>
        <button onClick={() => exportCsv(`${preset}`, result.rows as unknown as Record<string, unknown>[])}>
          ⇣ {t('exportCsv')}
        </button>
        <button onClick={() => exportJson(`${preset}`, result.rows)}>⇣ {t('exportJson')}</button>
      </div>

      <div className="report-summary">
        {result.summary.map((s) => (
          <div key={s.label} className="sn-kpi">
            <small>{s.label}</small>
            <strong>{s.value}</strong>
          </div>
        ))}
      </div>

      <article className="chart-card glass">
        <h3>{PRESET_LABELS[preset]}</h3>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={result.chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
              <XAxis dataKey="label" stroke="#cbd5e1" />
              <YAxis stroke="#cbd5e1" />
              <Tooltip />
              <Bar dataKey="value" fill="#60a5fa" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <div className="table-wrap" style={{ marginTop: 16 }}>
        {result.rows.length === 0 ? (
          <p className="muted">No data for the selected filters.</p>
        ) : (
          <table>
            <thead>
              <tr>
                {Object.keys(result.rows[0]).map((k) => (
                  <th key={k}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, idx) => (
                <tr key={idx}>
                  {Object.keys(result.rows[0]).map((k) => (
                    <td key={k}>{String(row[k])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h3 style={{ marginTop: 24 }}>{t('savedViews')}</h3>
      {views.length === 0 ? (
        <p className="muted">No saved views yet.</p>
      ) : (
        <div className="saved-view-list">
          {views.map((v) => (
            <div key={v.id} className="saved-view">
              <div>
                <strong>{v.name}</strong>
                <small>{PRESET_LABELS[v.preset]} · {v.createdAt}</small>
              </div>
              <div className="row-actions">
                <button onClick={() => loadView(v)}>Load</button>
                <ActionIconButton icon="🗑️" label="Delete view" onClick={() => removeView(v.id)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <FormModal open={saveOpen} title={t('saveView')} onClose={() => setSaveOpen(false)}>
        <div className="modal-form">
          <label>Name</label>
          <input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="My filtered view" />
          <div className="row-actions">
            <button onClick={handleSaveView}>Save</button>
          </div>
        </div>
      </FormModal>
    </section>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/employees/new" element={<PlaceholderPage title="New Employee" />} />
            <Route path="/employees/:id" element={<EmployeeDetailPage />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route element={<RoleRoute allow={['admin', 'manager']} />}>
              <Route path="/pipeline" element={<PipelinePage />} />
            </Route>
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/new" element={<NewReportPage />} />
            <Route path="/commissions" element={<CommissionsPage />} />
            <Route path="/partners" element={<PartnersPage />} />
            <Route path="/sos-sync" element={<SosSyncPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/reporting" element={<ReportingPage />} />
            <Route element={<RoleRoute allow={['admin', 'manager']} />}>
              <Route path="/unified-db" element={<UnifiedDbPage />} />
              <Route path="/hierarchy" element={<HierarchyPage />} />
            </Route>
            <Route element={<RoleRoute allow={['admin']} />}>
              <Route path="/branches" element={<BranchesPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/ledger" element={<LedgerPage />} />
            </Route>

            <Route element={<RoleRoute allow={['admin']} />}>
              <Route path="/admin/users" element={<PlaceholderPage title="Admin Users" />} />
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<PlaceholderPage title="404 Not Found" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
