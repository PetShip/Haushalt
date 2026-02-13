'use client'

import { KidStats, calculateFairness } from '@/lib/analytics'

interface FairnessPanelProps {
  weeklyStats: KidStats[]
  monthlyStats: KidStats[]
}

export default function FairnessPanel({ weeklyStats, monthlyStats }: FairnessPanelProps) {
  const weeklyFairness = calculateFairness(weeklyStats)
  const monthlyFairness = calculateFairness(monthlyStats)

  const getLeaderboard = (stats: KidStats[]) => {
    return [...stats].sort((a, b) => b.totalCompletions - a.totalCompletions)
  }

  const getPositionColor = (stats: KidStats[], index: number) => {
    if (stats.length === 0) return 'bg-gray-50'
    
    const currentCompletions = stats[index].totalCompletions
    const topCompletions = stats[0].totalCompletions
    const bottomCompletions = stats[stats.length - 1].totalCompletions
    
    // Check if tied for first place
    if (currentCompletions === topCompletions) {
      return 'bg-green-50 border border-green-200'
    }
    
    // Check if tied for last place (and there's more than one kid)
    if (stats.length > 1 && currentCompletions === bottomCompletions) {
      return 'bg-yellow-50 border border-yellow-200'
    }
    
    return 'bg-gray-50'
  }

  const weeklyLeaderboard = getLeaderboard(weeklyStats)
  const monthlyLeaderboard = getLeaderboard(monthlyStats)

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Fairness Overview</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Weekly Stats */}
        <div>
          <h3 className="font-semibold mb-2 text-primary-600">Last 7 Days</h3>
          <div className="space-y-2">
            {weeklyLeaderboard.map((stat, index) => (
              <div
                key={stat.kidId}
                className={`p-3 rounded-lg ${getPositionColor(weeklyLeaderboard, index)}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{stat.kidName}</span>
                  <div className="text-right">
                    <div className="font-semibold">{stat.totalCompletions} tasks</div>
                    {stat.totalMinutes > 0 && (
                      <div className="text-sm text-gray-600">{stat.totalMinutes} min</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {weeklyStats.length === 0 && (
              <p className="text-gray-500 text-sm">No data yet</p>
            )}
          </div>
          <div className="mt-3 text-sm">
            <span className="font-medium">Fairness:</span>{' '}
            <span
              className={
                weeklyFairness <= 1
                  ? 'text-green-600 font-semibold'
                  : weeklyFairness <= 3
                  ? 'text-yellow-600 font-semibold'
                  : 'text-red-600 font-semibold'
              }
            >
              {weeklyFairness === 0
                ? 'Perfect!'
                : weeklyFairness === 1
                ? '1 task difference'
                : `${weeklyFairness} tasks difference`}
            </span>
          </div>
        </div>

        {/* Monthly Stats */}
        <div>
          <h3 className="font-semibold mb-2 text-primary-600">Last 30 Days</h3>
          <div className="space-y-2">
            {monthlyLeaderboard.map((stat, index) => (
              <div
                key={stat.kidId}
                className={`p-3 rounded-lg ${getPositionColor(monthlyLeaderboard, index)}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{stat.kidName}</span>
                  <div className="text-right">
                    <div className="font-semibold">{stat.totalCompletions} tasks</div>
                    {stat.totalMinutes > 0 && (
                      <div className="text-sm text-gray-600">{stat.totalMinutes} min</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {monthlyStats.length === 0 && (
              <p className="text-gray-500 text-sm">No data yet</p>
            )}
          </div>
          <div className="mt-3 text-sm">
            <span className="font-medium">Fairness:</span>{' '}
            <span
              className={
                monthlyFairness <= 2
                  ? 'text-green-600 font-semibold'
                  : monthlyFairness <= 5
                  ? 'text-yellow-600 font-semibold'
                  : 'text-red-600 font-semibold'
              }
            >
              {monthlyFairness === 0
                ? 'Perfect!'
                : monthlyFairness === 1
                ? '1 task difference'
                : `${monthlyFairness} tasks difference`}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
