'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { validatePin } from '@/lib/pin'
import { monthWeeks, viennaToday } from '@/lib/chore-calendar'

const schema = z.object({ kidId: z.string().min(1), weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), completed: z.boolean(), pin: z.string() })

export async function setChoreWeek(input: z.infer<typeof schema>) {
  const data = schema.parse(input)
  if (!validatePin(data.pin)) throw new Error('Invalid PIN')
  const validWeek = monthWeeks(data.weekStart.slice(0, 7)).some(w => w.start === data.weekStart)
  if (!validWeek || data.weekStart > viennaToday()) throw new Error('Only current or past weeks can be updated.')
  const kid = await prisma.kid.findFirst({ where: { id: data.kidId, isActive: true }, select: { id: true } })
  if (!kid) throw new Error('Active kid not found')
  await prisma.choreWeek.upsert({
    where: { kidId_weekStart: { kidId: data.kidId, weekStart: data.weekStart } },
    create: { kidId: data.kidId, weekStart: data.weekStart, completed: data.completed },
    update: { completed: data.completed },
  })
  revalidatePath('/chores')
}
