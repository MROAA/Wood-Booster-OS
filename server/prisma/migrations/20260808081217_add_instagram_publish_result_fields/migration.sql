-- AlterTable
ALTER TABLE "SocialPostDraft" ADD COLUMN "publishError" TEXT;
ALTER TABLE "SocialPostDraft" ADD COLUMN "publishedAt" DATETIME;
ALTER TABLE "SocialPostDraft" ADD COLUMN "publishedPermalink" TEXT;
ALTER TABLE "SocialPostDraft" ADD COLUMN "publishedPostId" TEXT;
