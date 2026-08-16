-- AlterTable
ALTER TABLE "CodeChangeDraft" ADD COLUMN "revertPrBranch" TEXT;
ALTER TABLE "CodeChangeDraft" ADD COLUMN "revertPrNumber" INTEGER;
ALTER TABLE "CodeChangeDraft" ADD COLUMN "revertPrUrl" TEXT;

-- AlterTable
ALTER TABLE "CodeChangeDraftSet" ADD COLUMN "revertPrBranch" TEXT;
ALTER TABLE "CodeChangeDraftSet" ADD COLUMN "revertPrNumber" INTEGER;
ALTER TABLE "CodeChangeDraftSet" ADD COLUMN "revertPrUrl" TEXT;

-- AlterTable
ALTER TABLE "PythonCodeDraft" ADD COLUMN "revertPrBranch" TEXT;
ALTER TABLE "PythonCodeDraft" ADD COLUMN "revertPrNumber" INTEGER;
ALTER TABLE "PythonCodeDraft" ADD COLUMN "revertPrUrl" TEXT;
