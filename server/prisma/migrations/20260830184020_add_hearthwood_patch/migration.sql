-- CreateTable
CREATE TABLE "HeartwoodTask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'mechanic',
    "phase" TEXT NOT NULL DEFAULT 'Phase 0 - Concept',
    "status" TEXT NOT NULL DEFAULT 'backlog',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "complexity" TEXT NOT NULL DEFAULT 'M',
    "dependencies" TEXT,
    "acceptanceCriteria" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HeartwoodDecision" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'accepted',
    "affectedAreas" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "HearthwoodPatch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT,
    "summary" TEXT NOT NULL,
    "applyMode" TEXT NOT NULL,
    "risk" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "targetFiles" TEXT NOT NULL,
    "editSpec" TEXT NOT NULL,
    "diff" TEXT,
    "gitGuardianRef" TEXT,
    "liveCommit" TEXT,
    "backupPaths" TEXT,
    "qaResult" TEXT,
    "qaStartedAt" DATETIME,
    "qaFinishedAt" DATETIME,
    "prUrl" TEXT,
    "prNumber" INTEGER,
    "prBranch" TEXT,
    "model" TEXT,
    "createdBy" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
