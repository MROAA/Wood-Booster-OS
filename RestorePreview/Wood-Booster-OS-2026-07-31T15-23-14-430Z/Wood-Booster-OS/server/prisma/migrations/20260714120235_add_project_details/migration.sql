-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "customerId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'Suunnittelu',
    "deadline" DATETIME,
    "description" TEXT,
    "notes" TEXT,
    "laborHours" REAL NOT NULL DEFAULT 0,
    "hourlyRate" REAL NOT NULL DEFAULT 55,
    "otherCosts" REAL NOT NULL DEFAULT 0,
    "markupPercent" REAL NOT NULL DEFAULT 40,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Project_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("createdAt", "customerId", "hourlyRate", "id", "laborHours", "markupPercent", "name", "otherCosts", "updatedAt") SELECT "createdAt", "customerId", "hourlyRate", "id", "laborHours", "markupPercent", "name", "otherCosts", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
