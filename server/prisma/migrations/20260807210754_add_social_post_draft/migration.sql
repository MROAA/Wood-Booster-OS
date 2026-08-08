-- CreateTable
CREATE TABLE "SocialPostDraft" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "caption" TEXT NOT NULL,
    "hashtags" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'instagram',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "selectedFileIds" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SocialPostDraft_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
