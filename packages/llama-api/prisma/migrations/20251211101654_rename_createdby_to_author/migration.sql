-- AlterTable
-- First rename the column
ALTER TABLE "Emote" RENAME COLUMN "createdBy" TO "author";

-- Update any NULL values to a default value (e.g., "unknown" or "system")
UPDATE "Emote" SET "author" = 'unknown' WHERE "author" IS NULL;

-- Now make it NOT NULL
ALTER TABLE "Emote" ALTER COLUMN "author" SET NOT NULL;

