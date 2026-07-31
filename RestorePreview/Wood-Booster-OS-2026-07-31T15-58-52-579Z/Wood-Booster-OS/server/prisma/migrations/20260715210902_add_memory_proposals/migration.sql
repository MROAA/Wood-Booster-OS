/*
  Warnings:

  - Added the required column `updatedAt` to the `MemoryProposal` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MemoryProposal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "importance" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_MemoryProposal" ("category", "content", "createdAt", "id", "importance", "key", "status") SELECT "category", "content", "createdAt", "id", "importance", "key", "status" FROM "MemoryProposal";
DROP TABLE "MemoryProposal";
ALTER TABLE "new_MemoryProposal" RENAME TO "MemoryProposal";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
