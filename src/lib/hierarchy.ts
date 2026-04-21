import { getSessionUser, getUsers } from './demoAuth'
import { getBranches } from './orgData'
import { storeRead } from './store'
import type { AgentRecord } from './orgData'

export type HierarchyNode = {
  id: string
  name: string
  role: 'admin' | 'manager' | 'agent'
  meta?: string
  children: HierarchyNode[]
}

export function buildHierarchy(): HierarchyNode {
  const users = getUsers()
  const branches = getBranches()
  const agents = storeRead<AgentRecord[]>('ems_agents', [])
  const session = getSessionUser()

  const admin = users.find((u) => u.role === 'admin')
  const adminNode: HierarchyNode = {
    id: admin?.id ?? 'admin-root',
    name: admin?.name ?? 'Admin',
    role: 'admin',
    meta: 'All branches',
    children: [],
  }

  const visibleBranches =
    session?.role === 'manager' ? branches.filter((b) => b.name === session.branch) : branches

  visibleBranches.forEach((branch) => {
    const branchAgents = agents.filter((a) => a.branch === branch.name)
    const managerNode: HierarchyNode = {
      id: `mgr-${branch.id}`,
      name: branch.manager,
      role: 'manager',
      meta: `${branch.name} • ${branch.city}`,
      children: branchAgents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        role: 'agent',
        meta: agent.status,
        children: [],
      })),
    }
    adminNode.children.push(managerNode)
  })

  return adminNode
}
