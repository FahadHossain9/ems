type Listener = () => void

const listeners = new Map<string, Set<Listener>>()

export function storeRead<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  const raw = window.localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function storeWrite<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
  const bucket = listeners.get(key)
  if (bucket) bucket.forEach((fn) => fn())
}

export function storeRemove(key: string) {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(key)
  const bucket = listeners.get(key)
  if (bucket) bucket.forEach((fn) => fn())
}

export function storeSubscribe(key: string, fn: Listener) {
  if (!listeners.has(key)) listeners.set(key, new Set())
  listeners.get(key)!.add(fn)
  return () => {
    listeners.get(key)?.delete(fn)
  }
}

export function storeSeedIfMissing<T>(key: string, defaults: T) {
  if (typeof window === 'undefined') return
  if (!window.localStorage.getItem(key)) {
    window.localStorage.setItem(key, JSON.stringify(defaults))
  }
}
