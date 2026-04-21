/**
 * SOS Utenze & Servizi S.R.L. — shared demo constants (branches, consulenti, services).
 * Manager demo user (Elena Esposito) is scoped to MANAGER_SCOPE_BRANCH only.
 */

export const MANAGER_SCOPE_BRANCH = 'Nola'

export type BranchSeed = {
  id: string
  name: string
  city: string
  manager: string
  status: 'Active' | 'Planned'
}

export type AgentSeed = {
  id: string
  name: string
  email: string
  branch: string
  status: 'Active' | 'On Leave' | 'Inactive'
}

export const BRANCHES_SEED: BranchSeed[] = [
  { id: 'br-nola', name: 'Nola', city: 'Nola (HQ)', manager: 'Elena Esposito', status: 'Active' },
  { id: 'br-napoli', name: 'Napoli', city: 'Napoli', manager: 'Angelo Ioime', status: 'Active' },
  { id: 'br-cicciano', name: 'Cicciano', city: 'Cicciano', manager: 'Antonio Marrone', status: 'Active' },
  { id: 'br-salerno', name: 'Salerno', city: 'Salerno', manager: 'Marcella Del Prete', status: 'Active' },
  { id: 'br-catania', name: 'Catania', city: 'Catania', manager: 'Tiziana De Pasquale', status: 'Active' },
  { id: 'br-grammichele', name: 'Grammichele', city: 'Grammichele', manager: 'Orazio Litterio', status: 'Active' },
  { id: 'br-verona', name: 'Verona', city: 'Verona', manager: 'Luigi Bergamo', status: 'Active' },
  { id: 'br-avetrana', name: 'Avetrana', city: 'Avetrana', manager: 'Fabio Rizzato', status: 'Active' },
  { id: 'br-cerveteri', name: 'Cerveteri', city: 'Cerveteri (RM)', manager: 'Laura Martini', status: 'Active' },
  { id: 'br-roccanova', name: 'Roccanova', city: 'Roccanova', manager: 'Giuseppe Basilicata', status: 'Planned' },
  { id: 'br-tropea', name: 'Tropea', city: 'Tropea', manager: 'Attilio Rossi', status: 'Active' },
  { id: 'br-villacastelli', name: 'Villa Castelli', city: 'Villa Castelli', manager: 'Domenico Brindisi', status: 'Active' },
]

export const AGENTS_SEED: AgentSeed[] = [
  { id: 'ag-tc', name: 'Teresa Chiarello', email: 'teresa.chiarello@sosutenzeservizi.it', branch: 'Nola', status: 'Active' },
  { id: 'ag-lm', name: 'Lucia Mancini', email: 'lucia.mancini@sosutenzeservizi.it', branch: 'Nola', status: 'Active' },
  { id: 'ag-ai', name: 'Angelo Ioime', email: 'angelo.ioime@sosutenzeservizi.it', branch: 'Napoli', status: 'Active' },
  { id: 'ag-am', name: 'Antonio Marrone', email: 'antonio.marrone@sosutenzeservizi.it', branch: 'Cicciano', status: 'Active' },
  { id: 'ag-md', name: 'Marcella Del Prete', email: 'marcella.delprete@sosutenzeservizi.it', branch: 'Salerno', status: 'Active' },
  { id: 'ag-td', name: 'Tiziana De Pasquale', email: 'tiziana.depasquale@sosutenzeservizi.it', branch: 'Catania', status: 'Active' },
  { id: 'ag-ol', name: 'Orazio Litterio', email: 'orazio.litterio@sosutenzeservizi.it', branch: 'Grammichele', status: 'Active' },
  { id: 'ag-lb', name: 'Luigi Bergamo', email: 'luigi.bergamo@sosutenzeservizi.it', branch: 'Verona', status: 'Active' },
  { id: 'ag-fr', name: 'Fabio Rizzato', email: 'fabio.rizzato@sosutenzeservizi.it', branch: 'Avetrana', status: 'Active' },
  { id: 'ag-lr', name: 'Laura Martini', email: 'laura.martini@sosutenzeservizi.it', branch: 'Cerveteri', status: 'Active' },
  { id: 'ag-gb', name: 'Giuseppe Basilicata', email: 'giuseppe.basilicata@sosutenzeservizi.it', branch: 'Roccanova', status: 'On Leave' },
  { id: 'ag-ar', name: 'Attilio Rossi', email: 'attilio.rossi@sosutenzeservizi.it', branch: 'Tropea', status: 'Active' },
  { id: 'ag-db', name: 'Domenico Brindisi', email: 'domenico.brindisi@sosutenzeservizi.it', branch: 'Villa Castelli', status: 'Active' },
]

export const BRANCH_OPTIONS = BRANCHES_SEED.map((b) => b.name)

function buildAgentsByBranch(): Record<string, string[]> {
  const m: Record<string, string[]> = {}
  for (const a of AGENTS_SEED) {
    if (!m[a.branch]) m[a.branch] = []
    m[a.branch].push(a.name)
  }
  return m
}

export const AGENTS_BY_BRANCH = buildAgentsByBranch()

export const ALL_CONSULENTI = AGENTS_SEED.map((a) => a.name)

/** Lowercase keys; commission rules use capitalized labels (see finance.ts). */
export const SERVICE_TYPE_OPTIONS = [
  'luce',
  'gas',
  'fibra',
  'mobile',
  'assicurazioni',
  'mutui',
  'nlt',
  'malasanità',
] as const

export const PRACTICE_TYPE_OPTIONS = [
  'Voltura luce',
  'Subentro gas',
  'Cambio fornitore mercato libero',
  'Recupero morosità pregressa',
  'Attivazione fibra FTTH',
  'Bundle mobile 5G',
  'Preventivo mutuo prima casa',
  'Polizza famiglia / PMI',
  'NLT veicolo commerciale',
  'Pratica malasanità',
  'Consulenza cessione del quinto',
] as const
