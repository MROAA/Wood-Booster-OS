-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_KnowledgeDocument" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "topic" TEXT NOT NULL DEFAULT 'general',
    "folder" TEXT NOT NULL DEFAULT 'Yleinen',
    "tags" TEXT,
    "author" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'text',
    "sourceUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Luonnos',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "confidence" INTEGER NOT NULL DEFAULT 100,
    "alwaysUse" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_KnowledgeDocument" ("alwaysUse", "author", "content", "createdAt", "folder", "id", "priority", "sourceType", "sourceUrl", "status", "tags", "title", "topic", "updatedAt") SELECT "alwaysUse", "author", "content", "createdAt", "folder", "id", "priority", "sourceType", "sourceUrl", "status", "tags", "title", "topic", "updatedAt" FROM "KnowledgeDocument";
DROP TABLE "KnowledgeDocument";
ALTER TABLE "new_KnowledgeDocument" RENAME TO "KnowledgeDocument";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
