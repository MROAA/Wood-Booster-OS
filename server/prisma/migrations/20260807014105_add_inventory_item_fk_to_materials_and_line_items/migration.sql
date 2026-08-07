-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InvoiceLineItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kpl',
    "quantity" REAL NOT NULL DEFAULT 1,
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "inventoryItemId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InvoiceLineItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_InvoiceLineItem" ("createdAt", "id", "invoiceId", "name", "quantity", "unit", "unitPrice") SELECT "createdAt", "id", "invoiceId", "name", "quantity", "unit", "unitPrice" FROM "InvoiceLineItem";
DROP TABLE "InvoiceLineItem";
ALTER TABLE "new_InvoiceLineItem" RENAME TO "InvoiceLineItem";
CREATE TABLE "new_ProjectMaterial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'kpl',
    "quantity" REAL NOT NULL DEFAULT 1,
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "inventoryItemId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectMaterial_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectMaterial_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ProjectMaterial" ("category", "createdAt", "id", "name", "projectId", "quantity", "unit", "unitPrice") SELECT "category", "createdAt", "id", "name", "projectId", "quantity", "unit", "unitPrice" FROM "ProjectMaterial";
DROP TABLE "ProjectMaterial";
ALTER TABLE "new_ProjectMaterial" RENAME TO "ProjectMaterial";
CREATE TABLE "new_QuoteLineItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quoteId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kpl',
    "quantity" REAL NOT NULL DEFAULT 1,
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "inventoryItemId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuoteLineItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuoteLineItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_QuoteLineItem" ("createdAt", "id", "name", "quantity", "quoteId", "unit", "unitPrice") SELECT "createdAt", "id", "name", "quantity", "quoteId", "unit", "unitPrice" FROM "QuoteLineItem";
DROP TABLE "QuoteLineItem";
ALTER TABLE "new_QuoteLineItem" RENAME TO "QuoteLineItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
