-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InventoryItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "quantity" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'kpl',
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "supplier" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_InventoryItem" ("category", "createdAt", "id", "name", "notes", "quantity", "unit", "updatedAt") SELECT "category", "createdAt", "id", "name", "notes", "quantity", "unit", "updatedAt" FROM "InventoryItem";
DROP TABLE "InventoryItem";
ALTER TABLE "new_InventoryItem" RENAME TO "InventoryItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
