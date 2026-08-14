-- CreateTable
CREATE TABLE "CodeChangeDraft" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "prompt" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "explanation" TEXT,
    "filePath" TEXT NOT NULL,
    "originalCode" TEXT,
    "proposedCode" TEXT NOT NULL,
    "originalHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "writeError" TEXT,
    "backupPath" TEXT,
    "writtenAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
