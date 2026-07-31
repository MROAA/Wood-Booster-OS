-- CreateTable
CREATE TABLE "SpacemonkeySnapshotAudit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "event" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "risk" TEXT NOT NULL,
    "snapshot" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
