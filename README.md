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
