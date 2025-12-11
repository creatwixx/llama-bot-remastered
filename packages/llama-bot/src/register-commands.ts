// Register Discord slash commands
// Automatically detects environment (Railway, local dev, etc.) and loads appropriate config

import { REST, Routes } from "discord.js";
import { readdirSync, existsSync } from "fs";
import { join, resolve } from "path";
import { config } from "dotenv";

// Load environment variables based on environment
// Railway: Environment variables are already set, no .env file needed
// Local dev: Load from .env.local if it exists
const envPath = resolve(process.cwd(), "../../infra/.env.local");

let isRailway = false;
try {
  // Check if .env.local exists and is readable (local dev)
  if (existsSync(envPath)) {
    config({ path: envPath });
    console.log(`[DEV] Loaded environment from ${envPath}`);
  } else {
    // .env.local doesn't exist, assume Railway (env vars already set)
    isRailway = true;
    console.log("[RAILWAY] Using Railway environment variables");
  }
} catch (error) {
  // If we can't read .env.local, assume Railway
  isRailway = true;
  console.log("[RAILWAY] Using Railway environment variables");
}

const commands: any[] = [];

// Load commands
const commandsPath = join(process.cwd(), "src/commands");
const commandFiles = readdirSync(commandsPath).filter((file) =>
  file.endsWith(".ts")
);

for (const file of commandFiles) {
  const filePath = join(commandsPath, file);
  const command = await import(filePath);
  if (command.default?.data) {
    commands.push(command.default.data.toJSON());
  }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

const clientId = process.env.DISCORD_APP_ID!;
const guildId = process.env.DISCORD_GUILD_ID; // Optional, for guild commands

const envPrefix = isRailway ? "[RAILWAY]" : "[DEV]";

try {
  console.log(
    `${envPrefix} Started refreshing ${commands.length} application (/) commands.`
  );

  // Register commands (guild-scoped if guildId is set, global otherwise)
  if (guildId) {
    const data: any = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );
    console.log(
      `${envPrefix} Successfully reloaded ${data.length} application (/) commands for guild ${guildId}.`
    );
  } else {
    const data: any = await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });
    console.log(
      `${envPrefix} Successfully reloaded ${data.length} application (/) commands globally.`
    );
  }

  console.log(`${envPrefix} Command registration complete!`);
  process.exit(0);
} catch (error) {
  console.error(`${envPrefix} Error registering commands:`, error);
  process.exit(1);
}
