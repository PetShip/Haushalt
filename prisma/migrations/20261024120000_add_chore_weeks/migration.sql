CREATE TABLE "chore_weeks" (
  "id" TEXT NOT NULL,
  "kidId" TEXT NOT NULL,
  "weekStart" TEXT NOT NULL,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "chore_weeks_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chore_weeks_kidId_fkey" FOREIGN KEY ("kidId") REFERENCES "kids"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "chore_weeks_kidId_weekStart_key" ON "chore_weeks"("kidId", "weekStart");
CREATE INDEX "chore_weeks_weekStart_idx" ON "chore_weeks"("weekStart");
