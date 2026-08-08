/*
  Warnings:

  - Added the required column `updatedAt` to the `ProjectFile` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProjectFile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT NOT NULL DEFAULT 'Muut',
    "sourceFileId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ready',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectFile_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "ProjectFile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ProjectFile" ("category", "createdAt", "id", "mimeType", "originalName", "projectId", "size", "storedName") SELECT "category", "createdAt", "id", "mimeType", "originalName", "projectId", "size", "storedName" FROM "ProjectFile";
DROP TABLE "ProjectFile";
ALTER TABLE "new_ProjectFile" RENAME TO "ProjectFile";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
