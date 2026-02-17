'use client'

import { useEffect, useState } from 'react'

interface TvPenalty {
  kidId: string
  kidName: string
  totalMinutes: number
  count: number
}

interface TvPenaltiesOverviewProps {
  penalties: TvPenalty[]
  kids: { id: string; firstName: string }[]
}

export default function TvPenaltiesOverview({ penalties, kids }: TvPenaltiesOverviewProps) {
  // Calculate total penalties per kid
  const kidPenalties = kids.map((kid) => {
    const penalty = penalties.find((p) => p.kidId === kid.id)
    return {
      kidId: kid.id,
      kidName: kid.firstName,
      totalMinutes: penalty?.totalMinutes || 0,
      count: penalty?.count || 0,
    }
  })

  // Sort by total minutes descending
  const sortedPenalties = [...kidPenalties].sort((a, b) => b.totalMinutes - a.totalMinutes)

  const maxMinutes = Math.max(...sortedPenalties.map((p) => p.totalMinutes), 1)

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-2 text-gray-900 flex items-center gap-2">
        <span>📺</span>
        TV Penalties
      </h2>
      <p className="text-gray-600 mb-6 text-sm">
        Total TV time penalties for this week
      </p>

      <div className="space-y-4">
        {sortedPenalties.map((penalty) => {
          const percentage = maxMinutes > 0 ? (penalty.totalMinutes / maxMinutes) * 100 : 0
          const hasNoPenalties = penalty.totalMinutes === 0

          return (
            <div
              key={penalty.kidId}
              className={`p-4 rounded-lg border-2 transition-all ${
                hasNoPenalties
                  ? 'bg-green-50 border-green-200'
                  : penalty.totalMinutes >= maxMinutes && maxMinutes > 0
                  ? 'bg-red-50 border-red-300'
                  : 'bg-orange-50 border-orange-200'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-gray-900">
                    {penalty.kidName}
                  </span>
                  {hasNoPenalties && (
                    <span className="text-sm text-green-600" title="No penalties!">
                      ✅
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-red-600">
                    {penalty.totalMinutes}
                  </div>
                  <div className="text-xs text-gray-600">
                    min ({penalty.count} {penalty.count === 1 ? 'penalty' : 'penalties'})
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    hasNoPenalties
                      ? 'bg-green-500'
                      : 'bg-gradient-to-r from-orange-500 to-red-600'
                  }`}
                  style={{ width: `${Math.max(percentage, penalty.totalMinutes > 0 ? 10 : 0)}%` }}
                />
              </div>
            </div>
          )
        })}

        {kidPenalties.length === 0 && (
          <p className="text-gray-500 text-center py-8">No data available</p>
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {sortedPenalties.reduce((sum, p) => sum + p.totalMinutes, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Penalty Minutes This Week</div>
        </div>
      </div>
    </div>
  )
}
