-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Quote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Avoin',
    "validDays" INTEGER NOT NULL DEFAULT 14,
    "paymentTerms" TEXT NOT NULL DEFAULT '14 pv netto',
    "deliveryTime" TEXT,
    "laborCost" REAL NOT NULL DEFAULT 0,
    "otherCosts" REAL NOT NULL DEFAULT 0,
    "customPrice" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Quote" ("createdAt", "customPrice", "deliveryTime", "id", "laborCost", "otherCosts", "paymentTerms", "projectId", "quoteNumber", "updatedAt", "validDays") SELECT "createdAt", "customPrice", "deliveryTime", "id", "laborCost", "otherCosts", "paymentTerms", "projectId", "quoteNumber", "updatedAt", "validDays" FROM "Quote";
DROP TABLE "Quote";
ALTER TABLE "new_Quote" RENAME TO "Quote";
CREATE UNIQUE INDEX "Quote_projectId_key" ON "Quote"("projectId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
