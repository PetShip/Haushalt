import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create kids
  const paul = await prisma.kid.create({
    data: {
      firstName: 'Paul',
      isActive: true,
    },
  })

  const anna = await prisma.kid.create({
    data: {
      firstName: 'Anna',
      isActive: true,
    },
  })

  console.log('Created kids:', paul.firstName, anna.firstName)

  // Create regular tasks
  const tischdecken = await prisma.task.create({
    data: {
      title: 'Tischdecken',
      group: 'REGULAR',
      isActive: true,
    },
  })

  const biomuell = await prisma.task.create({
    data: {
      title: 'Biomüll',
      group: 'REGULAR',
      isActive: true,
    },
  })

  // Create 10-min task
  const socken = await prisma.task.create({
    data: {
      title: 'Socken zusammensuchen',
      group: 'TEN_MIN',
      isActive: true,
    },
  })

  console.log('Created tasks:', tischdecken.title, biomuell.title, socken.title)

  // Create sample completion logs over past 2 weeks
  const now = new Date()
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const completions = [
    // Week 1
    { kidId: paul.id, taskId: tischdecken.id, daysAgo: 13 },
    { kidId: anna.id, taskId: tischdecken.id, daysAgo: 13 },
    { kidId: paul.id, taskId: biomuell.id, daysAgo: 12 },
    { kidId: anna.id, taskId: socken.id, daysAgo: 11, minutes: 10 },
    { kidId: paul.id, taskId: tischdecken.id, daysAgo: 10 },
    { kidId: anna.id, taskId: tischdecken.id, daysAgo: 10 },
    { kidId: paul.id, taskId: socken.id, daysAgo: 9, minutes: 10 },
    { kidId: anna.id, taskId: biomuell.id, daysAgo: 8 },
    { kidId: paul.id, taskId: tischdecken.id, daysAgo: 7 },
    // Week 2
    { kidId: anna.id, taskId: tischdecken.id, daysAgo: 6 },
    { kidId: paul.id, taskId: biomuell.id, daysAgo: 5 },
    { kidId: anna.id, taskId: socken.id, daysAgo: 4, minutes: 10 },
    { kidId: paul.id, taskId: tischdecken.id, daysAgo: 3 },
    { kidId: anna.id, taskId: tischdecken.id, daysAgo: 3 },
    { kidId: paul.id, taskId: socken.id, daysAgo: 2, minutes: 10 },
    { kidId: anna.id, taskId: biomuell.id, daysAgo: 1 },
    { kidId: paul.id, taskId: tischdecken.id, daysAgo: 1 },
    { kidId: anna.id, taskId: tischdecken.id, daysAgo: 0 },
  ]

  for (const completion of completions) {
    const createdAt = new Date(now.getTime() - completion.daysAgo * 24 * 60 * 60 * 1000)
    await prisma.completionLog.create({
      data: {
        kidId: completion.kidId,
        taskId: completion.taskId,
        minutes: completion.minutes || null,
        createdAt,
      },
    })
  }

  console.log(`Created ${completions.length} completion logs`)
  console.log('Seeding complete!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
