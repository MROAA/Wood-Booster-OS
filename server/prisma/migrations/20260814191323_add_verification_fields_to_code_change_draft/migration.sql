-- AlterTable
ALTER TABLE "CodeChangeDraft" ADD COLUMN "testCode" TEXT;
ALTER TABLE "CodeChangeDraft" ADD COLUMN "testOutput" TEXT;
ALTER TABLE "CodeChangeDraft" ADD COLUMN "testSkippedReason" TEXT;
ALTER TABLE "CodeChangeDraft" ADD COLUMN "testStatus" TEXT;
