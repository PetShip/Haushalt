'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { validatePin } from '@/lib/pin'

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  group: z.enum(['REGULAR', 'TEN_MIN', 'TV_PENALTY']),
  kidIds: z.array(z.string()).optional(),
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

const deleteTaskSchema = z.object({
  id: z.string(),
  pin: z.string(),
})

const updateTaskKidsSchema = z.object({
  taskId: z.string(),
  kidIds: z.array(z.string()),
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
      group: validated.group,
    },
  })

  // If kidIds are provided, create assignments. Otherwise, assign to all active kids
  const kidIds = validated.kidIds && validated.kidIds.length > 0 
    ? validated.kidIds 
    : (await prisma.kid.findMany({ where: { isActive: true } })).map(k => k.id)

  if (kidIds.length > 0) {
    await prisma.taskKidAssignment.createMany({
      data: kidIds.map(kidId => ({
        taskId: task.id,
        kidId,
      })),
    })
  }

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

export async function deleteTask(data: z.infer<typeof deleteTaskSchema>) {
  const validated = deleteTaskSchema.parse(data)

  if (!validatePin(validated.pin)) {
    throw new Error('Invalid PIN')
  }

  // Soft delete: set isActive to false
  const deleted = await prisma.task.update({
    where: { id: validated.id },
    data: {
      isActive: false,
    },
  })

  revalidatePath('/')
  revalidatePath('/tasks')

  return deleted
}

export async function getTasks() {
  return prisma.task.findMany({
    orderBy: { title: 'asc' },
  })
}

export async function getActiveTasks() {
  return prisma.task.findMany({
    where: { isActive: true },
    orderBy: [{ order: 'asc' }, { title: 'asc' }],
  })
}

export async function updateTaskKids(data: z.infer<typeof updateTaskKidsSchema>) {
  const validated = updateTaskKidsSchema.parse(data)

  if (!validatePin(validated.pin)) {
    throw new Error('Invalid PIN')
  }

  // Delete existing assignments
  await prisma.taskKidAssignment.deleteMany({
    where: { taskId: validated.taskId },
  })

  // Create new assignments
  if (validated.kidIds.length > 0) {
    await prisma.taskKidAssignment.createMany({
      data: validated.kidIds.map(kidId => ({
        taskId: validated.taskId,
        kidId,
      })),
    })
  }

  revalidatePath('/')
  revalidatePath('/tasks')
  revalidatePath('/history')

  return { success: true }
}

export async function getTasksWithKids() {
  return prisma.task.findMany({
    include: {
      kidAssignments: {
        include: {
          kid: true,
        },
      },
    },
    orderBy: { title: 'asc' },
  })
}

export async function getActiveTasksWithKids() {
  return prisma.task.findMany({
    where: { isActive: true },
    include: {
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
}

const updateTaskOrderSchema = z.object({
  taskId: z.string(),
  newOrder: z.number(),
  pin: z.string(),
})

export async function updateTaskOrder(data: z.infer<typeof updateTaskOrderSchema>) {
  const validated = updateTaskOrderSchema.parse(data)

  if (!validatePin(validated.pin)) {
    throw new Error('Invalid PIN')
  }

  const task = await prisma.task.update({
    where: { id: validated.taskId },
    data: {
      order: validated.newOrder,
    },
  })

  revalidatePath('/')
  revalidatePath('/tasks')

  return task
}

const reorderTasksSchema = z.object({
  taskIds: z.array(z.string()),
  pin: z.string(),
})

export async function getActiveTasksWithOrder() {
  return prisma.task.findMany({
    where: { isActive: true, group: 'REGULAR' },
    select: {
      id: true,
      title: true,
      order: true,
    },
    orderBy: [{ order: 'asc' }, { title: 'asc' }],
  })
}

export async function reorderTasks(data: z.infer<typeof reorderTasksSchema>) {
  const validated = reorderTasksSchema.parse(data)

  if (!validatePin(validated.pin)) {
    throw new Error('Invalid PIN')
  }

  // Update each task with its new order
  await Promise.all(
    validated.taskIds.map((taskId, index) =>
      prisma.task.update({
        where: { id: taskId },
        data: { order: index },
      })
    )
  )

  revalidatePath('/')
  revalidatePath('/tasks')

  return { success: true }
}
