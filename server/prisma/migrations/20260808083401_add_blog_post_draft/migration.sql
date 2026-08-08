-- CreateTable
CREATE TABLE "BlogPostDraft" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "wordpressPostStatus" TEXT NOT NULL DEFAULT 'publish',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "wordpressPostId" TEXT,
    "wordpressPermalink" TEXT,
    "publishError" TEXT,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BlogPostDraft_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
