-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_KnowledgeDocument" (
    "folder" TEXT NOT NULL DEFAULT 'Yleinen',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "confidence" INTEGER NOT NULL DEFAULT 100,
    "alwaysUse" BOOLEAN NOT NULL DEFAULT false,
    "author" TEXT,
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'text',
    "sourceUrl" TEXT,
    "topic" TEXT NOT NULL DEFAULT 'Yleinen',
    "tags" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Hyväksytty',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_KnowledgeDocument" ("content", "createdAt", "id", "sourceType", "sourceUrl", "status", "tags", "title", "topic", "updatedAt") SELECT "content", "createdAt", "id", "sourceType", "sourceUrl", "status", "tags", "title", "topic", "updatedAt" FROM "KnowledgeDocument";
DROP TABLE "KnowledgeDocument";
ALTER TABLE "new_KnowledgeDocument" RENAME TO "KnowledgeDocument";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
