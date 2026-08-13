-- This migration documents a table that was already created directly
-- against the database outside the normal migration flow, causing
-- drift. No SQL is executed here (marked as already-applied via
-- `prisma migrate resolve`) since the table already exists.
CREATE TABLE "GitSyncEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "repository" TEXT,
    "branch" TEXT,
    "commit" TEXT,
    "changedFiles" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
