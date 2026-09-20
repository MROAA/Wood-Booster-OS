-- CreateTable
CREATE TABLE "HearthwoodScreenLayout" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "screenId" TEXT NOT NULL,
    "positions" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BloodmoorPatch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT,
    "summary" TEXT NOT NULL,
    "applyMode" TEXT NOT NULL,
    "risk" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "targetFiles" TEXT NOT NULL,
    "editSpec" TEXT NOT NULL,
    "diff" TEXT,
    "liveCommit" TEXT,
    "backupPaths" TEXT,
    "qaResult" TEXT,
    "qaStartedAt" DATETIME,
    "qaFinishedAt" DATETIME,
    "model" TEXT,
    "createdBy" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "HearthwoodScreenLayout_screenId_key" ON "HearthwoodScreenLayout"("screenId");
