-- AlterTable: Rename createdBy to author and make it NOT NULL
-- This migration handles the case where the column might already be renamed

DO $$
BEGIN
    -- Check if createdBy column exists and rename it
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Emote' 
        AND column_name = 'createdBy'
    ) THEN
        ALTER TABLE "Emote" RENAME COLUMN "createdBy" TO "author";
    END IF;
    
    -- Ensure the author column exists (it should now, either from rename or already existing)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Emote' 
        AND column_name = 'author'
    ) THEN
        -- Update any NULL values to a default value
        UPDATE "Emote" SET "author" = 'unknown' WHERE "author" IS NULL;
        
        -- Check if column is already NOT NULL before trying to set it
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'Emote' 
            AND column_name = 'author' 
            AND is_nullable = 'YES'
        ) THEN
            ALTER TABLE "Emote" ALTER COLUMN "author" SET NOT NULL;
        END IF;
    END IF;
END $$;

