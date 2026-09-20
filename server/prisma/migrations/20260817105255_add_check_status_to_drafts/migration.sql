-- AlterTable
ALTER TABLE "CodeChangeDraft" ADD COLUMN "checkStatus" TEXT;
ALTER TABLE "CodeChangeDraft" ADD COLUMN "checkStatusCheckedAt" DATETIME;

-- AlterTable
ALTER TABLE "CodeChangeDraftSet" ADD COLUMN "checkStatus" TEXT;
ALTER TABLE "CodeChangeDraftSet" ADD COLUMN "checkStatusCheckedAt" DATETIME;

-- AlterTable
ALTER TABLE "PythonCodeDraft" ADD COLUMN "checkStatus" TEXT;
ALTER TABLE "PythonCodeDraft" ADD COLUMN "checkStatusCheckedAt" DATETIME;
