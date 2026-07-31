-- CreateTable
CREATE TABLE "SpacemonkeyWorldEntity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SpacemonkeyWorldRelation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromEntityId" TEXT NOT NULL,
    "toEntityId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SpacemonkeyWorldRelation_fromEntityId_fkey" FOREIGN KEY ("fromEntityId") REFERENCES "SpacemonkeyWorldEntity" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SpacemonkeyWorldRelation_toEntityId_fkey" FOREIGN KEY ("toEntityId") REFERENCES "SpacemonkeyWorldEntity" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
