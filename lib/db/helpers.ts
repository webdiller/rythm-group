export function getNestedValue(obj: unknown, path: string): string | undefined {
  return path.split(".").reduce((current: unknown, key) => (current as Record<string, unknown>)?.[key], obj) as
    | string
    | undefined
}

export function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split(".")
  const lastKey = keys.pop()!
  const target = keys.reduce((current: Record<string, unknown>, key) => {
    if (!current[key]) {
      current[key] = {}
    }
    return current[key] as Record<string, unknown>
  }, obj)
  target[lastKey] = value
}
