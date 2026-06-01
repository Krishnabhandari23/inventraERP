-- CreateTable
CREATE TABLE "ProductionJob" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "jobNumber" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "assignedTo" TEXT,
    "materials" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductionJob_jobNumber_key" ON "ProductionJob"("jobNumber");

-- CreateIndex
CREATE INDEX "ProductionJob_tenantId_status_idx" ON "ProductionJob"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ProductionJob_jobNumber_idx" ON "ProductionJob"("jobNumber");
