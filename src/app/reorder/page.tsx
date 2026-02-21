import { getActiveTasksWithOrder } from '@/actions/tasks'
import { isPinRequired } from '@/lib/pin'
import TaskOrdering from '@/components/dashboard/TaskOrdering'
import PinProtectedContent from '@/components/PinProtectedContent'

export const dynamic = 'force-dynamic'

export default async function ReorderPage() {
  const [tasksWithOrder, pinRequired] = await Promise.all([
    getActiveTasksWithOrder(),
    isPinRequired(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reorder Tasks</h1>
        <p className="text-gray-600 mt-1">Change the order in which tasks appear on the dashboard</p>
      </div>

      <PinProtectedContent
        pinRequired={pinRequired}
        readOnlyChildren={
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500">Please unlock to reorder tasks.</p>
          </div>
        }
      >
        {tasksWithOrder.length > 0 ? (
          <TaskOrdering tasks={tasksWithOrder} pinRequired={pinRequired} />
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500">No regular tasks found. <a href="/tasks" className="underline font-semibold">Add some tasks</a> first.</p>
          </div>
        )}
      </PinProtectedContent>
    </div>
  )
}
