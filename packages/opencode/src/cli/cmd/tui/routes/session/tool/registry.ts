const registry = new Map<string, () => void>()

export function register(id: string, fn: () => void) {
  registry.set(id, fn)
  return () => {
    registry.delete(id)
  }
}

export function toggle(id: string) {
  registry.get(id)?.()
}

export function ids() {
  return [...registry.keys()]
}

export function clear() {
  registry.clear()
}

export function size() {
  return registry.size
}

export function toggleAll(fn: (id: string) => void) {
  for (const id of registry.keys()) fn(id)
}
