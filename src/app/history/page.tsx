import { getRecentCompletions } from '@/actions/logs'
import { isPinRequired } from '@/lib/pin'
import HistoryTable from '@/components/history/HistoryTable'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const logs = await getRecentCompletions(14)
  const pinRequired = await isPinRequired()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">History</h1>
        <p className="text-gray-600 mt-1">View and manage completion logs (last 14 days)</p>
      </div>

      <HistoryTable logs={logs} pinRequired={pinRequired} />
    </div>
  )
}
