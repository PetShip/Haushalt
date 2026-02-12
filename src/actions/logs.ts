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
