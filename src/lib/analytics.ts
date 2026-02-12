import { prisma } from './prisma'

export interface KidStats {
  kidId: string
  kidName: string
  totalCompletions: number
  totalMinutes: number
}

export interface TaskStats {
  taskId: string
  taskTitle: string
  totalCompletions: number
  completionsByKid: { kidId: string; kidName: string; count: number }[]
}

export async function getKidStats(
  startDate: Date,
  endDate: Date = new Date()
): Promise<KidStats[]> {
  const kids = await prisma.kid.findMany({
    where: { isActive: true },
    include: {
      completions: {
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    },
  })

  return kids.map((kid) => ({
    kidId: kid.id,
    kidName: kid.firstName,
    totalCompletions: kid.completions.length,
    totalMinutes: kid.completions.reduce(
      (sum, completion) => sum + (completion.minutes || 0),
      0
    ),
  }))
}

export async function getTaskStats(
  startDate: Date,
  endDate: Date = new Date(),
  group?: 'REGULAR' | 'TEN_MIN'
): Promise<TaskStats[]> {
  const tasks = await prisma.task.findMany({
    where: {
      isActive: true,
      ...(group ? { group } : {}),
    },
    include: {
      completions: {
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          kid: true,
        },
      },
    },
  })

  return tasks.map((task) => {
    const completionsByKid = task.completions.reduce(
      (acc, completion) => {
        const existing = acc.find((item) => item.kidId === completion.kidId)
        if (existing) {
          existing.count++
        } else {
          acc.push({
            kidId: completion.kidId,
            kidName: completion.kid.firstName,
            count: 1,
          })
        }
        return acc
      },
      [] as { kidId: string; kidName: string; count: number }[]
    )

    return {
      taskId: task.id,
      taskTitle: task.title,
      totalCompletions: task.completions.length,
      completionsByKid,
    }
  })
}

export function calculateFairness(stats: KidStats[]): number {
  if (stats.length === 0) return 0

  const completions = stats.map((s) => s.totalCompletions)
  const max = Math.max(...completions)
  const min = Math.min(...completions)

  return max - min
}
