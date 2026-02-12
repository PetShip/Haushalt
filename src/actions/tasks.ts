'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { validatePin } from '@/lib/pin'
import { TaskGroup } from '@prisma/client'

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  group: z.enum(['REGULAR', 'TEN_MIN']),
  pin: z.string(),
})

const updateTaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  pin: z.string(),
})

const toggleTaskSchema = z.object({
  id: z.string(),
  pin: z.string(),
})

export async function createTask(data: z.infer<typeof createTaskSchema>) {
  const validated = createTaskSchema.parse(data)

  if (!validatePin(validated.pin)) {
    throw new Error('Invalid PIN')
  }

  const task = await prisma.task.create({
    data: {
      title: validated.title,
      group: validated.group as TaskGroup,
    },
  })

  revalidatePath('/')
  revalidatePath('/tasks')

  return task
}

export async function updateTask(data: z.infer<typeof updateTaskSchema>) {
  const validated = updateTaskSchema.parse(data)

  if (!validatePin(validated.pin)) {
    throw new Error('Invalid PIN')
  }

  const task = await prisma.task.update({
    where: { id: validated.id },
    data: {
      title: validated.title,
    },
  })

  revalidatePath('/')
  revalidatePath('/tasks')

  return task
}

export async function toggleTaskActive(data: z.infer<typeof toggleTaskSchema>) {
  const validated = toggleTaskSchema.parse(data)

  if (!validatePin(validated.pin)) {
    throw new Error('Invalid PIN')
  }

  const task = await prisma.task.findUnique({
    where: { id: validated.id },
  })

  if (!task) {
    throw new Error('Task not found')
  }

  const updated = await prisma.task.update({
    where: { id: validated.id },
    data: {
      isActive: !task.isActive,
    },
  })

  revalidatePath('/')
  revalidatePath('/tasks')

  return updated
}

export async function getTasks() {
  return prisma.task.findMany({
    orderBy: { title: 'asc' },
  })
}

export async function getActiveTasks() {
  return prisma.task.findMany({
    where: { isActive: true },
    orderBy: { title: 'asc' },
  })
}
