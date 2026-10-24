# 🏠 Haushalt - Household Chore Tracker

Simple web app to track kids' household chores and contributions.

## Setup

### Prerequisites

Ensure PostgreSQL is installed and running on your system:
- PostgreSQL server should be accessible at `localhost:5432`
- Create a database named `haushalt` and a user with appropriate permissions
- Or update the `DATABASE_URL` in your `.env` file to match your PostgreSQL configuration

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create .env file:
   ```bash
   cp .env.example .env
   ```

3. Run database migrations:
   ```bash
   npm run db:migrate
   ```

4. Seed database:
   ```bash
   npm run db:seed
   ```

5. Start dev server:
   ```bash
   npm run dev
   ```

6. Open http://localhost:3000

## Features

- Track kids and chores
- Log task completions
- View fairness statistics
- PIN-protected write operations
- Mobile-friendly UI

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- PostgreSQL + Prisma
- Server Actions

## Chores and pocket money

`/chores` records one housework confirmation per active child and ISO week.
Weeks belong to the month containing their Monday, including weeks ending in
another month. A child is eligible for monthly pocket money once all those
weeks are confirmed and the final Sunday has passed (Europe/Vienna).
This is an eligibility indicator, not a payment integration.
Writes use the existing administrator PIN. Future weeks cannot be confirmed.

The 10-minute category is archived in the UI; tasks and completion history
remain in the database. Archived task names can be viewed under Tasks.

Before running the updated app against a database, apply the new migration:

```sh
npx prisma migrate deploy
npx prisma generate
```

Calendar and restricted-browser-storage checks:

```sh
node --test tests/chores.cjs
```
