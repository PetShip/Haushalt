import { getActiveKids } from '@/actions/kids'
import { getActiveTasks } from '@/actions/tasks'
import { getTaskStats, getTvPenaltyStats } from '@/lib/analytics'
import { isPinRequired } from '@/lib/pin'
import RegularTaskChart from '@/components/dashboard/RegularTaskChart'
import TenMinTasksOverview from '@/components/dashboard/TenMinTasksOverview'
import TvPenaltiesOverview from '@/components/dashboard/TvPenaltiesOverview'
import QuickActions from '@/components/dashboard/QuickActions'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [kids, tasks, pinRequired] = await Promise.all([
    getActiveKids(), 
    getActiveTasks(),
    isPinRequired(),
  ])

  // Calculate date ranges
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Get statistics - only need task stats for the new dashboard
  const [regularTaskStats, tenMinTaskStats, tvPenaltyStats] = await Promise.all([
    getTaskStats(weekAgo, now, 'REGULAR'),
    getTaskStats(weekAgo, now, 'TEN_MIN'),
    getTvPenaltyStats(weekAgo, now),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of household chores and contributions</p>
      </div>

      {/* Show warnings if no kids or tasks */}
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

      {/* Main dashboard layout */}
      {kids.length > 0 && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Regular Tasks - takes 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Regular Tasks Progress</h2>
            {regularTaskStats.length > 0 ? (
              regularTaskStats.map((task) => (
                <RegularTaskChart key={task.taskId} task={task} kids={kids} pinRequired={pinRequired} />
              ))
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500">
                  No regular tasks yet. <a href="/tasks" className="underline font-semibold">Add some tasks</a> to get started!
                </p>
              </div>
            )}
          </div>

          {/* Right sidebar - takes 1 column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <QuickActions kids={kids} pinRequired={pinRequired} />
            
            {/* 10-Minute Tasks Overview */}
            <TenMinTasksOverview tasks={tenMinTaskStats} kids={kids} pinRequired={pinRequired} />
            
            {/* TV Penalties Overview */}
            <TvPenaltiesOverview penalties={tvPenaltyStats} kids={kids} />
          </div>
        </div>
      )}
    </div>
  )
}
