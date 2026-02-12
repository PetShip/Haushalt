import { getActiveKids } from '@/actions/kids'
import { getActiveTasks } from '@/actions/tasks'
import { getKidStats, getTaskStats } from '@/lib/analytics'
import TaskGroupCard from '@/components/dashboard/TaskGroupCard'
import FairnessPanel from '@/components/dashboard/FairnessPanel'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [kids, tasks] = await Promise.all([getActiveKids(), getActiveTasks()])

  // Calculate date ranges
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Get statistics
  const [weeklyStats, monthlyStats, regularTaskStats, tenMinTaskStats] = await Promise.all([
    getKidStats(weekAgo),
    getKidStats(monthAgo),
    getTaskStats(weekAgo, now, 'REGULAR'),
    getTaskStats(weekAgo, now, 'TEN_MIN'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of household chores and contributions</p>
      </div>

      <FairnessPanel weeklyStats={weeklyStats} monthlyStats={monthlyStats} />

      <div className="grid md:grid-cols-2 gap-6">
        <TaskGroupCard
          title="Regular Tasks"
          tasks={regularTaskStats}
          kids={kids}
        />
        <TaskGroupCard
          title="10-Minute Tasks"
          tasks={tenMinTaskStats}
          kids={kids}
        />
      </div>

      {kids.length === 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-yellow-700">
            No active kids found. <a href="/kids" className="underline font-semibold">Add some kids</a> to get started!
          </p>
        </div>
      )}

      {tasks.length === 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-yellow-700">
            No active tasks found. <a href="/tasks" className="underline font-semibold">Add some tasks</a> to get started!
          </p>
        </div>
      )}
    </div>
  )
}
