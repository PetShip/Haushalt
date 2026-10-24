// Some mobile/private browsers deny sessionStorage access. Keep the current
// tab usable even when persistence is unavailable.
const memory = new Map<string, string>()

export const browserStorage = {
  getItem(key: string): string | null {
    try { return window.sessionStorage.getItem(key) ?? memory.get(key) ?? null }
    catch { return memory.get(key) ?? null }
  },
  setItem(key: string, value: string) {
    memory.set(key, value)
    try { window.sessionStorage.setItem(key, value) } catch { /* tab memory fallback */ }
    window.dispatchEvent(new Event('haushalt-auth'))
  },
  removeItem(key: string) {
    memory.delete(key)
    try { window.sessionStorage.removeItem(key) } catch { /* tab memory fallback */ }
    window.dispatchEvent(new Event('haushalt-auth'))
  },
}
