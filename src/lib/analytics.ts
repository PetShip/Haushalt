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
  assignedKids: { kidId: string; kidName: string }[]
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
  group?: 'REGULAR' | 'TEN_MIN' | 'TV_PENALTY'
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
      kidAssignments: {
        include: {
          kid: {
            select: {
              id: true,
              firstName: true,
              isActive: true,
            },
          },
        },
        where: {
          kid: {
            isActive: true,
          },
        },
      },
    },
    orderBy: [{ order: 'asc' }, { title: 'asc' }],
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

    const assignedKids = task.kidAssignments.map((assignment) => ({
      kidId: assignment.kid.id,
      kidName: assignment.kid.firstName,
    }))

    return {
      taskId: task.id,
      taskTitle: task.title,
      totalCompletions: task.completions.length,
      completionsByKid,
      assignedKids,
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

export async function getTvPenaltyStats(
  startDate: Date,
  endDate: Date = new Date()
): Promise<{ kidId: string; kidName: string; totalMinutes: number; count: number }[]> {
  const kids = await prisma.kid.findMany({
    where: { isActive: true },
    include: {
      completions: {
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          task: {
            group: 'TV_PENALTY',
          },
        },
        include: {
          task: true,
        },
      },
    },
  })

  return kids.map((kid) => ({
    kidId: kid.id,
    kidName: kid.firstName,
    totalMinutes: kid.completions.reduce(
      (sum, completion) => sum + (completion.minutes || 0),
      0
    ),
    count: kid.completions.length,
  }))
}
