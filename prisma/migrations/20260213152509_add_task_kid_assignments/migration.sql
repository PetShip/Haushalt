-- CreateTable
CREATE TABLE "task_kid_assignments" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "kidId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_kid_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_kid_assignments_taskId_idx" ON "task_kid_assignments"("taskId");

-- CreateIndex
CREATE INDEX "task_kid_assignments_kidId_idx" ON "task_kid_assignments"("kidId");

-- CreateIndex
CREATE UNIQUE INDEX "task_kid_assignments_taskId_kidId_key" ON "task_kid_assignments"("taskId", "kidId");

-- AddForeignKey
ALTER TABLE "task_kid_assignments" ADD CONSTRAINT "task_kid_assignments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_kid_assignments" ADD CONSTRAINT "task_kid_assignments_kidId_fkey" FOREIGN KEY ("kidId") REFERENCES "kids"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data migration: Assign all existing tasks to all active kids
INSERT INTO "task_kid_assignments" ("id", "taskId", "kidId", "createdAt")
SELECT 
    gen_random_uuid()::text,
    t.id,
    k.id,
    CURRENT_TIMESTAMP
FROM tasks t
CROSS JOIN kids k
WHERE t."isActive" = true AND k."isActive" = true
ON CONFLICT ("taskId", "kidId") DO NOTHING;
