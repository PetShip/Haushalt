'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setChoreWeek } from '@/actions/chores'
import { browserStorage } from '@/lib/browser-storage'

interface Props {
  month: string
  today: string
  weeks: { start: string; end: string; number: number; year: number }[]
  kids: { id: string; firstName: string }[]
  records: { kidId: string; weekStart: string; completed: boolean }[]
  pinRequired: boolean
}

export default function ChoresOverview({ month, today, weeks, kids, records, pinRequired }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  async function toggle(kidId: string, weekStart: string, completed: boolean) {
    const pin = browserStorage.getItem('haushalt_pin') || ''
    if (pinRequired && !pin) { setError('Use Unlock in the menu before confirming housework.'); return }
    setBusy(true)
    setError('')
    try { await setChoreWeek({ kidId, weekStart, completed, pin }); router.refresh() }
    catch { setError('Could not save. Check your connection and PIN, then try again.') }
    finally { setBusy(false) }
  }
  if (!kids.length) return <p>No active kids. Add kids to start tracking housework.</p>
  return <div className="space-y-4">
    {error && <p role="alert" className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</p>}
    {kids.map(kid => {
      const done = (start: string) => records.some(r => r.kidId === kid.id && r.weekStart === start && r.completed)
      const count = weeks.filter(w => done(w.start)).length
      const ended = today > weeks[weeks.length - 1].end
      const eligible = ended && count === weeks.length
      return <section key={kid.id} className="bg-white rounded-xl shadow p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap justify-between gap-2"><h2 className="text-xl font-bold">{kid.firstName}</h2><span className={`rounded-full px-3 py-1 text-sm font-medium ${eligible ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{eligible ? 'Pocket money eligible' : ended ? 'Housework incomplete' : 'Month in progress'}</span></div>
        <p className="text-sm text-gray-600">{month}: {count} / {weeks.length} weeks completed</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{weeks.map(week => {
          const current = today >= week.start && today <= week.end
          const future = week.start > today
          return <label key={week.start} className={`flex items-center gap-3 border rounded-lg p-4 ${current ? 'border-primary-500 bg-primary-50' : ''} ${future ? 'text-gray-400' : ''}`}>
            <input type="checkbox" checked={done(week.start)} disabled={busy || future} onChange={e => void toggle(kid.id, week.start, e.target.checked)} className="w-6 h-6 shrink-0" />
            <span><span className="block font-semibold">CW {week.number} / {week.year}{current ? ' · Current' : ''}</span><span className="block text-sm">{week.start.slice(8)}.{week.start.slice(5, 7)}. – {week.end.slice(8)}.{week.end.slice(5, 7)}.</span><span className="text-sm">{future ? 'Upcoming' : done(week.start) ? 'Completed' : 'Not confirmed'}</span></span>
          </label>
        })}</div>
      </section>
    })}
  </div>
}
