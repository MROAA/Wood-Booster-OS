-- AlterTable
ALTER TABLE "KnowledgeDocument" ADD COLUMN "fileSize" INTEGER;
ALTER TABLE "KnowledgeDocument" ADD COLUMN "mimeType" TEXT;
ALTER TABLE "KnowledgeDocument" ADD COLUMN "originalFileName" TEXT;
ALTER TABLE "KnowledgeDocument" ADD COLUMN "storedFileName" TEXT;
