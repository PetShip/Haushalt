-- CreateTable
CREATE TABLE "kids" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "completion_logs" (
    "id" TEXT NOT NULL,
    "kidId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "minutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "completion_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "completion_logs_kidId_idx" ON "completion_logs"("kidId");

-- CreateIndex
CREATE INDEX "completion_logs_taskId_idx" ON "completion_logs"("taskId");

-- CreateIndex
CREATE INDEX "completion_logs_createdAt_idx" ON "completion_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "completion_logs" ADD CONSTRAINT "completion_logs_kidId_fkey" FOREIGN KEY ("kidId") REFERENCES "kids"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completion_logs" ADD CONSTRAINT "completion_logs_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
