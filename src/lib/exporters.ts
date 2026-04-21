function triggerDownload(filename: string, mime: string, content: string) {
  if (typeof window === 'undefined') return
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportJson<T>(filename: string, rows: T[]) {
  triggerDownload(filename.endsWith('.json') ? filename : `${filename}.json`, 'application/json', JSON.stringify(rows, null, 2))
}

export function exportCsv<T extends Record<string, unknown>>(filename: string, rows: T[]) {
  if (rows.length === 0) {
    triggerDownload(filename.endsWith('.csv') ? filename : `${filename}.csv`, 'text/csv', '')
    return
  }
  const columns = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((k) => set.add(k))
      return set
    }, new Set<string>()),
  )
  const escape = (val: unknown) => {
    if (val === null || val === undefined) return ''
    const s = typeof val === 'string' ? val : JSON.stringify(val)
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const header = columns.join(',')
  const body = rows.map((row) => columns.map((c) => escape(row[c])).join(',')).join('\n')
  triggerDownload(
    filename.endsWith('.csv') ? filename : `${filename}.csv`,
    'text/csv',
    `${header}\n${body}`,
  )
}
