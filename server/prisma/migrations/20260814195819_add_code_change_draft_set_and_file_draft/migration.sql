-- CreateTable
CREATE TABLE "CodeChangeDraftSet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "prompt" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "planExplanation" TEXT,
    "planError" TEXT,
    "writeError" TEXT,
    "writtenAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CodeChangeFileDraft" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "setId" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "originalCode" TEXT,
    "proposedCode" TEXT,
    "originalHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "blockedCode" TEXT,
    "generateError" TEXT,
    "writeError" TEXT,
    "backupPath" TEXT,
    "testCode" TEXT,
    "testStatus" TEXT,
    "testOutput" TEXT,
    "testSkippedReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CodeChangeFileDraft_setId_fkey" FOREIGN KEY ("setId") REFERENCES "CodeChangeDraftSet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
