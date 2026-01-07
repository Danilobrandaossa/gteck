-- AlterTable
ALTER TABLE "ai_content" ADD COLUMN "organizationId" TEXT;

-- Update existing records to get organizationId from site
UPDATE "ai_content" 
SET "organizationId" = (
  SELECT "organizationId" 
  FROM "sites" 
  WHERE "sites"."id" = "ai_content"."siteId"
);

-- Make organizationId NOT NULL after update
-- SQLite doesn't support ALTER COLUMN, so we need to recreate the table
CREATE TABLE "ai_content_new" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "excerpt" TEXT,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "language" TEXT NOT NULL DEFAULT 'pt-BR',
    "category" TEXT,
    "tags" TEXT,
    "keywords" TEXT,
    "secondaryKeywords" TEXT,
    "aiModel" TEXT,
    "prompt" TEXT,
    "additionalInstructions" TEXT,
    "generationConfig" TEXT DEFAULT '{}',
    "wordCount" INTEGER,
    "errorMessage" TEXT,
    "wordpressPostId" INTEGER,
    "wordpressUrl" TEXT,
    "metaDescription" TEXT,
    "featuredImage" TEXT,
    "featuredImageAlt" TEXT,
    "organizationId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),

    CONSTRAINT "ai_content_pkey" PRIMARY KEY ("id")
);

-- Copy data
INSERT INTO "ai_content_new" SELECT * FROM "ai_content";

-- Drop old table
DROP TABLE "ai_content";

-- Rename new table
ALTER TABLE "ai_content_new" RENAME TO "ai_content";

-- AddForeignKey
ALTER TABLE "ai_content" ADD CONSTRAINT "ai_content_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;



