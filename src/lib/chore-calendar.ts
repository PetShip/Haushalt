export function viennaToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Vienna', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const part = (type: string) => parts.find(p => p.type === type)!.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function monthWeeks(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || Number(month.slice(0, 4)) < 2000 || Number(month.slice(0, 4)) > 2100) {
    throw new Error('Invalid month')
  }
  const first = new Date(`${month}-01T00:00:00Z`)
  first.setUTCDate(1 + (8 - first.getUTCDay()) % 7)
  const weeks: { start: string; end: string; number: number; year: number }[] = []
  for (const day = new Date(first); day.toISOString().slice(0, 7) === month; day.setUTCDate(day.getUTCDate() + 7)) {
    const thursday = new Date(day)
    thursday.setUTCDate(day.getUTCDate() + 3)
    const year = thursday.getUTCFullYear()
    const number = Math.ceil(((thursday.getTime() - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7)
    const end = new Date(day)
    end.setUTCDate(day.getUTCDate() + 6)
    weeks.push({ start: day.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10), number, year })
  }
  return weeks
}
