-- CreateTable
CREATE TABLE "BusinessSettings" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
