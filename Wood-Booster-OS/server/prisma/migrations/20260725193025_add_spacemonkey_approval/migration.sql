-- CreateTable
CREATE TABLE "SpacemonkeyApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL,
    "risk" TEXT,
    "filePath" TEXT,
    "instruction" TEXT,
    "changePlan" TEXT,
    "reasons" TEXT,
    "requirements" TEXT,
    "nextAction" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME
);
