-- CreateTable
CREATE TABLE "HearthwoodScreenLayout" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "screenId" TEXT NOT NULL,
    "positions" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "HearthwoodScreenLayout_screenId_key" ON "HearthwoodScreenLayout"("screenId");
