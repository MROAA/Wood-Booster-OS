-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CodeChangeDraft" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "prompt" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "explanation" TEXT,
    "filePath" TEXT NOT NULL,
    "originalCode" TEXT,
    "proposedCode" TEXT NOT NULL,
    "model" TEXT,
    "originalHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "writeError" TEXT,
    "backupPath" TEXT,
    "testCode" TEXT,
    "testStatus" TEXT,
    "testOutput" TEXT,
    "testSkippedReason" TEXT,
    "prUrl" TEXT,
    "prNumber" INTEGER,
    "prBranch" TEXT,
    "revertPrUrl" TEXT,
    "revertPrNumber" INTEGER,
    "revertPrBranch" TEXT,
    "checkStatus" TEXT,
    "checkStatusCheckedAt" DATETIME,
    "writtenAt" DATETIME,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CodeChangeDraft" ("backupPath", "checkStatus", "checkStatusCheckedAt", "createdAt", "explanation", "filePath", "id", "model", "originalCode", "originalHash", "prBranch", "prNumber", "prUrl", "prompt", "proposedCode", "revertPrBranch", "revertPrNumber", "revertPrUrl", "status", "testCode", "testOutput", "testSkippedReason", "testStatus", "title", "updatedAt", "writeError", "writtenAt") SELECT "backupPath", "checkStatus", "checkStatusCheckedAt", "createdAt", "explanation", "filePath", "id", "model", "originalCode", "originalHash", "prBranch", "prNumber", "prUrl", "prompt", "proposedCode", "revertPrBranch", "revertPrNumber", "revertPrUrl", "status", "testCode", "testOutput", "testSkippedReason", "testStatus", "title", "updatedAt", "writeError", "writtenAt" FROM "CodeChangeDraft";
DROP TABLE "CodeChangeDraft";
ALTER TABLE "new_CodeChangeDraft" RENAME TO "CodeChangeDraft";
CREATE TABLE "new_CodeChangeDraftSet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "prompt" TEXT NOT NULL,
    "model" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "planExplanation" TEXT,
    "planError" TEXT,
    "writeError" TEXT,
    "prUrl" TEXT,
    "prNumber" INTEGER,
    "prBranch" TEXT,
    "revertPrUrl" TEXT,
    "revertPrNumber" INTEGER,
    "revertPrBranch" TEXT,
    "checkStatus" TEXT,
    "checkStatusCheckedAt" DATETIME,
    "writtenAt" DATETIME,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CodeChangeDraftSet" ("checkStatus", "checkStatusCheckedAt", "createdAt", "id", "model", "planError", "planExplanation", "prBranch", "prNumber", "prUrl", "prompt", "revertPrBranch", "revertPrNumber", "revertPrUrl", "status", "updatedAt", "writeError", "writtenAt") SELECT "checkStatus", "checkStatusCheckedAt", "createdAt", "id", "model", "planError", "planExplanation", "prBranch", "prNumber", "prUrl", "prompt", "revertPrBranch", "revertPrNumber", "revertPrUrl", "status", "updatedAt", "writeError", "writtenAt" FROM "CodeChangeDraftSet";
DROP TABLE "CodeChangeDraftSet";
ALTER TABLE "new_CodeChangeDraftSet" RENAME TO "CodeChangeDraftSet";
CREATE TABLE "new_PythonCodeDraft" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "prompt" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "model" TEXT,
    "originalCode" TEXT,
    "originalHash" TEXT,
    "filePath" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "writeError" TEXT,
    "backupPath" TEXT,
    "unresolvedReferences" TEXT,
    "testCode" TEXT,
    "testStatus" TEXT,
    "testOutput" TEXT,
    "testSkippedReason" TEXT,
    "prUrl" TEXT,
    "prNumber" INTEGER,
    "prBranch" TEXT,
    "revertPrUrl" TEXT,
    "revertPrNumber" INTEGER,
    "revertPrBranch" TEXT,
    "checkStatus" TEXT,
    "checkStatusCheckedAt" DATETIME,
    "writtenAt" DATETIME,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PythonCodeDraft" ("backupPath", "checkStatus", "checkStatusCheckedAt", "code", "createdAt", "filePath", "id", "model", "originalCode", "originalHash", "prBranch", "prNumber", "prUrl", "prompt", "revertPrBranch", "revertPrNumber", "revertPrUrl", "status", "testCode", "testOutput", "testSkippedReason", "testStatus", "title", "unresolvedReferences", "updatedAt", "writeError", "writtenAt") SELECT "backupPath", "checkStatus", "checkStatusCheckedAt", "code", "createdAt", "filePath", "id", "model", "originalCode", "originalHash", "prBranch", "prNumber", "prUrl", "prompt", "revertPrBranch", "revertPrNumber", "revertPrUrl", "status", "testCode", "testOutput", "testSkippedReason", "testStatus", "title", "unresolvedReferences", "updatedAt", "writeError", "writtenAt" FROM "PythonCodeDraft";
DROP TABLE "PythonCodeDraft";
ALTER TABLE "new_PythonCodeDraft" RENAME TO "PythonCodeDraft";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
