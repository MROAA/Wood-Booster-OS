-- CreateTable
CREATE TABLE "Invoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "dueDays" INTEGER NOT NULL DEFAULT 14,
    "paymentTerms" TEXT NOT NULL DEFAULT '14 pv netto',
    "vatPercent" REAL NOT NULL DEFAULT 25.5,
    "laborCost" REAL NOT NULL DEFAULT 0,
    "otherCosts" REAL NOT NULL DEFAULT 0,
    "customPrice" REAL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvoiceLineItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kpl',
    "quantity" REAL NOT NULL DEFAULT 1,
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BusinessSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyName" TEXT,
    "streetAddress" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "businessId" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "iban" TEXT,
    "logoOriginalName" TEXT,
    "logoStoredName" TEXT,
    "logoMimeType" TEXT,
    "vatPercent" REAL NOT NULL DEFAULT 25.5,
    "defaultPaymentTerms" TEXT NOT NULL DEFAULT '14 pv netto',
    "defaultValidDays" INTEGER NOT NULL DEFAULT 14,
    "quoteNumberPrefix" TEXT NOT NULL DEFAULT 'WB-Q',
    "invoiceNumberPrefix" TEXT NOT NULL DEFAULT 'WB-L',
    "defaultInvoiceDueDays" INTEGER NOT NULL DEFAULT 14,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_BusinessSettings" ("businessId", "city", "companyName", "createdAt", "defaultPaymentTerms", "defaultValidDays", "email", "iban", "id", "logoMimeType", "logoOriginalName", "logoStoredName", "phone", "postalCode", "quoteNumberPrefix", "streetAddress", "updatedAt", "vatPercent", "website") SELECT "businessId", "city", "companyName", "createdAt", "defaultPaymentTerms", "defaultValidDays", "email", "iban", "id", "logoMimeType", "logoOriginalName", "logoStoredName", "phone", "postalCode", "quoteNumberPrefix", "streetAddress", "updatedAt", "vatPercent", "website" FROM "BusinessSettings";
DROP TABLE "BusinessSettings";
ALTER TABLE "new_BusinessSettings" RENAME TO "BusinessSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_projectId_key" ON "Invoice"("projectId");
