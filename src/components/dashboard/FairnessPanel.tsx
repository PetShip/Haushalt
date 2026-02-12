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
                className={`p-3 rounded-lg ${
                  index === 0
                    ? 'bg-green-50 border border-green-200'
                    : index === weeklyLeaderboard.length - 1 && weeklyLeaderboard.length > 1
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-gray-50'
                }`}
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
                className={`p-3 rounded-lg ${
                  index === 0
                    ? 'bg-green-50 border border-green-200'
                    : index === monthlyLeaderboard.length - 1 && monthlyLeaderboard.length > 1
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-gray-50'
                }`}
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
