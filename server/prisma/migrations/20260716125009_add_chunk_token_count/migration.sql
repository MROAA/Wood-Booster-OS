-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_KnowledgeChunk" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "tokenCount" INTEGER NOT NULL DEFAULT 0,
    "documentId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KnowledgeChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_KnowledgeChunk" ("chunkIndex", "content", "createdAt", "documentId", "id") SELECT "chunkIndex", "content", "createdAt", "documentId", "id" FROM "KnowledgeChunk";
DROP TABLE "KnowledgeChunk";
ALTER TABLE "new_KnowledgeChunk" RENAME TO "KnowledgeChunk";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
