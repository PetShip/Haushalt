'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { validatePin } from '@/lib/pin'

const toggleArrangementSchema = z.object({
  pin: z.string(),
})

// Get the next sleeping arrangement based on the last entry
export async function getNextSleepingArrangement() {
  const lastArrangement = await prisma.sleepingArrangement.findFirst({
    orderBy: {
      createdAt: 'desc',
    },
  })

  // If no arrangement exists or last was paul-rosalie, next is paul-mavi
  // Otherwise, next is paul-rosalie
  const nextCombination = !lastArrangement || lastArrangement.combination === 'paul-rosalie'
    ? 'paul-mavi'
    : 'paul-rosalie'

  return {
    combination: nextCombination,
    pairs: nextCombination === 'paul-rosalie'
      ? [
          { pair1: 'Paul', pair2: 'Rosalie' },
          { pair1: 'Anna-Sophia', pair2: 'Mavi' },
        ]
      : [
          { pair1: 'Paul', pair2: 'Mavi' },
          { pair1: 'Anna-Sophia', pair2: 'Rosalie' },
        ],
  }
}

// Toggle to the next arrangement
export async function toggleSleepingArrangement(data: z.infer<typeof toggleArrangementSchema>) {
  const validated = toggleArrangementSchema.parse(data)

  if (!validatePin(validated.pin)) {
    throw new Error('Invalid PIN')
  }

  const next = await getNextSleepingArrangement()

  const arrangement = await prisma.sleepingArrangement.create({
    data: {
      combination: next.combination,
    },
  })

  revalidatePath('/sleeping')

  return arrangement
}

// Get the current (most recent) sleeping arrangement
export async function getCurrentSleepingArrangement() {
  return getNextSleepingArrangement()
}
