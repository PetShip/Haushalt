'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { validatePin } from '@/lib/pin'

const createKidSchema = z.object({
  firstName: z.string().min(1, 'Name is required'),
  pin: z.string(),
})

const updateKidSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1, 'Name is required'),
  pin: z.string(),
})

const toggleKidSchema = z.object({
  id: z.string(),
  pin: z.string(),
})

const deleteKidSchema = z.object({
  id: z.string(),
  pin: z.string(),
})

export async function createKid(data: z.infer<typeof createKidSchema>) {
  const validated = createKidSchema.parse(data)

  if (!validatePin(validated.pin)) {
    throw new Error('Invalid PIN')
  }

  const kid = await prisma.kid.create({
    data: {
      firstName: validated.firstName,
    },
  })

  revalidatePath('/')
  revalidatePath('/kids')

  return kid
}

export async function updateKid(data: z.infer<typeof updateKidSchema>) {
  const validated = updateKidSchema.parse(data)

  if (!validatePin(validated.pin)) {
    throw new Error('Invalid PIN')
  }

  const kid = await prisma.kid.update({
    where: { id: validated.id },
    data: {
      firstName: validated.firstName,
    },
  })

  revalidatePath('/')
  revalidatePath('/kids')

  return kid
}

export async function toggleKidActive(data: z.infer<typeof toggleKidSchema>) {
  const validated = toggleKidSchema.parse(data)

  if (!validatePin(validated.pin)) {
    throw new Error('Invalid PIN')
  }

  const kid = await prisma.kid.findUnique({
    where: { id: validated.id },
  })

  if (!kid) {
    throw new Error('Kid not found')
  }

  const updated = await prisma.kid.update({
    where: { id: validated.id },
    data: {
      isActive: !kid.isActive,
    },
  })

  revalidatePath('/')
  revalidatePath('/kids')

  return updated
}

export async function deleteKid(data: z.infer<typeof deleteKidSchema>) {
  const validated = deleteKidSchema.parse(data)

  if (!validatePin(validated.pin)) {
    throw new Error('Invalid PIN')
  }

  // Soft delete: set isActive to false
  const deleted = await prisma.kid.update({
    where: { id: validated.id },
    data: {
      isActive: false,
    },
  })

  revalidatePath('/')
  revalidatePath('/kids')

  return deleted
}

export async function getKids() {
  return prisma.kid.findMany({
    orderBy: { firstName: 'asc' },
  })
}

export async function getActiveKids() {
  return prisma.kid.findMany({
    where: { isActive: true },
    orderBy: { firstName: 'asc' },
  })
}
