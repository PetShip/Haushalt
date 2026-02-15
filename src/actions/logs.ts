'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { validatePin } from '@/lib/pin'

const createCompletionSchema = z.object({
  kidId: z.string(),
  taskId: z.string(),
  minutes: z.number().optional(),
  pin: z.string(),
})

const deleteCompletionSchema = z.object({
  id: z.string(),
  pin: z.string(),
})

export async function createCompletion(data: z.infer<typeof createCompletionSchema>) {
  const validated = createCompletionSchema.parse(data)

  if (!validatePin(validated.pin)) {
    throw new Error('Invalid PIN')
  }

  const completion = await prisma.completionLog.create({
    data: {
      kidId: validated.kidId,
      taskId: validated.taskId,
      minutes: validated.minutes || null,
    },
  })

  revalidatePath('/')
  revalidatePath('/history')

  return completion
}

export async function deleteCompletion(data: z.infer<typeof deleteCompletionSchema>) {
  const validated = deleteCompletionSchema.parse(data)

  if (!validatePin(validated.pin)) {
    throw new Error('Invalid PIN')
  }

  const completion = await prisma.completionLog.delete({
    where: { id: validated.id },
  })

  revalidatePath('/')
  revalidatePath('/history')

  return completion
}

export async function getRecentCompletions(days: number = 14) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  return prisma.completionLog.findMany({
    where: {
      createdAt: {
        gte: startDate,
      },
    },
    include: {
      kid: true,
      task: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

const quickTenMinuteTaskSchema = z.object({
  kidId: z.string(),
  minutes: z.number().min(1).max(60).optional().default(10),
  pin: z.string(),
})

export async function logQuickTenMinuteTask(data: z.infer<typeof quickTenMinuteTaskSchema>) {
  const validated = quickTenMinuteTaskSchema.parse(data)

  if (!validatePin(validated.pin)) {
    throw new Error('Invalid PIN')
  }

  // Find or create a generic "10-Minute Task" task
  let task = await prisma.task.findFirst({
    where: {
      title: '10-Minute Task',
      group: 'TEN_MIN',
    },
  })

  if (!task) {
    task = await prisma.task.create({
      data: {
        title: '10-Minute Task',
        group: 'TEN_MIN',
        isActive: true,
        order: 0,
      },
    })
  }

  const completion = await prisma.completionLog.create({
    data: {
      kidId: validated.kidId,
      taskId: task.id,
      minutes: validated.minutes,
    },
  })

  revalidatePath('/')
  revalidatePath('/history')

  return completion
}

const tvPenaltySchema = z.object({
  kidId: z.string(),
  minutes: z.number().min(5).max(30),
  pin: z.string(),
})

export async function logTvPenalty(data: z.infer<typeof tvPenaltySchema>) {
  const validated = tvPenaltySchema.parse(data)

  if (!validatePin(validated.pin)) {
    throw new Error('Invalid PIN')
  }

  // Find or create a TV Penalty task
  let task = await prisma.task.findFirst({
    where: {
      title: 'TV Penalty',
      group: 'TV_PENALTY',
    },
  })

  if (!task) {
    task = await prisma.task.create({
      data: {
        title: 'TV Penalty',
        group: 'TV_PENALTY',
        isActive: true,
        order: 999, // Put penalties at the end
      },
    })
  }

  const completion = await prisma.completionLog.create({
    data: {
      kidId: validated.kidId,
      taskId: task.id,
      minutes: validated.minutes,
    },
  })

  revalidatePath('/')
  revalidatePath('/history')

  return completion
}
