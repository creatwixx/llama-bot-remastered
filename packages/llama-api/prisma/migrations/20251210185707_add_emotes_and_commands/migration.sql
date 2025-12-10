-- CreateTable
CREATE TABLE "Emote" (
    "id" TEXT NOT NULL,
    "guildId" TEXT,
    "trigger" TEXT NOT NULL,
    "emote" TEXT NOT NULL,
    "exactMatch" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Emote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Command" (
    "id" TEXT NOT NULL,
    "guildId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "response" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Command_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Emote_guildId_idx" ON "Emote"("guildId");

-- CreateIndex
CREATE INDEX "Emote_trigger_idx" ON "Emote"("trigger");

-- CreateIndex
CREATE INDEX "Command_guildId_idx" ON "Command"("guildId");

-- CreateIndex
CREATE INDEX "Command_name_idx" ON "Command"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Command_guildId_name_key" ON "Command"("guildId", "name");
