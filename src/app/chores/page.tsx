import Link from 'next/link'
import { getActiveKids } from '@/actions/kids'
import { prisma } from '@/lib/prisma'
import { isPinRequired } from '@/lib/pin'
import { monthWeeks, viennaToday } from '@/lib/chore-calendar'
import ChoresOverview from '@/components/chores/ChoresOverview'

export const dynamic = 'force-dynamic'

export default async function ChoresPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const params = await searchParams
  const today = viennaToday()
  let month = params.month || today.slice(0, 7)
  try { monthWeeks(month) } catch { month = today.slice(0, 7) }
  const weeks = monthWeeks(month)
  const [kids, records, pinRequired] = await Promise.all([
    getActiveKids(),
    prisma.choreWeek.findMany({ where: { weekStart: { in: weeks.map(w => w.start) } }, select: { kidId: true, weekStart: true, completed: true } }),
    isPinRequired(),
  ])
  const adjacent = (offset: number) => {
    const date = new Date(`${month}-01T00:00:00Z`)
    date.setUTCMonth(date.getUTCMonth() + offset)
    return date.toISOString().slice(0, 7)
  }
  return <div className="space-y-6">
    <div><h1 className="text-3xl font-bold">Chores</h1><p className="text-gray-600 mt-2">Weekly housework &amp; monthly pocket money</p></div>
    <form className="flex flex-wrap items-end gap-3">
      <label className="font-medium">Month<input aria-label="Month" type="month" name="month" defaultValue={month} min="2000-01" max="2100-12" className="block border rounded-md p-2 mt-1" /></label>
      <button className="bg-primary-600 text-white rounded-md px-4 py-2">Show month</button>
      <Link className="underline p-2" href={`?month=${adjacent(-1)}`}>Previous</Link>
      <Link className="underline p-2" href={`?month=${adjacent(1)}`}>Next</Link>
      <Link className="underline p-2" href="/chores">Current month</Link>
    </form>
    <p className="text-sm text-gray-600">Each week belongs to the month of its Monday. Confirm once all housework for that week is done. Pocket money is eligible after every week is completed and the last Sunday has passed. This records eligibility; it does not send a payment.</p>
    <ChoresOverview key={month} month={month} today={today} weeks={weeks} kids={kids} records={records} pinRequired={pinRequired} />
  </div>
}
