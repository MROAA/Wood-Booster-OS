-- AlterTable
ALTER TABLE "CodeChangeDraft" ADD COLUMN "prBranch" TEXT;
ALTER TABLE "CodeChangeDraft" ADD COLUMN "prNumber" INTEGER;
ALTER TABLE "CodeChangeDraft" ADD COLUMN "prUrl" TEXT;

-- AlterTable
ALTER TABLE "CodeChangeDraftSet" ADD COLUMN "prBranch" TEXT;
ALTER TABLE "CodeChangeDraftSet" ADD COLUMN "prNumber" INTEGER;
ALTER TABLE "CodeChangeDraftSet" ADD COLUMN "prUrl" TEXT;

-- AlterTable
ALTER TABLE "PythonCodeDraft" ADD COLUMN "prBranch" TEXT;
ALTER TABLE "PythonCodeDraft" ADD COLUMN "prNumber" INTEGER;
ALTER TABLE "PythonCodeDraft" ADD COLUMN "prUrl" TEXT;
