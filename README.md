# 🏠 Haushalt - Household Chore Tracker

Simple web app to track kids' household chores and contributions.

## Setup

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
- SQLite + Prisma
- Server Actions
