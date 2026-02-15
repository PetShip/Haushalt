import { getCurrentSleepingArrangement } from '@/actions/sleeping'
import { isPinRequired } from '@/lib/pin'
import SleepingArrangementView from '@/components/sleeping/SleepingArrangementView'

export const dynamic = 'force-dynamic'

export default async function SleepingPage() {
  const [arrangement, pinRequired] = await Promise.all([
    getCurrentSleepingArrangement(),
    isPinRequired(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sleeping Arrangements</h1>
        <p className="text-gray-600 mt-1">Who sleeps together next time</p>
      </div>

      <SleepingArrangementView arrangement={arrangement} pinRequired={pinRequired} />
    </div>
  )
}
