'use server'

import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function logLogin() {
  const headersList = await headers()
  const ipAddress = headersList.get('x-forwarded-for') || 
                    headersList.get('x-real-ip') || 
                    'unknown'
  const userAgent = headersList.get('user-agent') || undefined

  const log = await prisma.loginLog.create({
    data: {
      ipAddress,
      userAgent,
    },
  })

  return log
}

export async function getRecentLogins(limit: number = 50) {
  return prisma.loginLog.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  })
}
