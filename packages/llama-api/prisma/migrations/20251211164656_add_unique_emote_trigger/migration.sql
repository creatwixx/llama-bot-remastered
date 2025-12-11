-- Remove duplicate emotes (keep the most recent one for each guildId + trigger combination)
-- This handles existing duplicates before adding the unique constraint
WITH duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY "guildId", "trigger"
      ORDER BY "createdAt" DESC
    ) as rn
  FROM "Emote"
)
DELETE FROM "Emote"
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "Emote_guildId_trigger_key" ON "Emote"("guildId", "trigger");
