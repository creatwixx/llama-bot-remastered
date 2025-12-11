import {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Events,
} from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { config } from "dotenv";
import { resolve } from "path";
import "./health.js";
import { handleEmoteMessage } from "./listeners/emote.listener.js";

// Command type definition
interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

// Load environment variables (only if not already set by Docker/env_file)
// For local development, use .env.local
// For production (Railway), environment variables are set by Railway
if (!process.env.DISCORD_TOKEN) {
  if (process.env.NODE_ENV === "development") {
    config({ path: resolve(process.cwd(), "../../infra/.env.local") });
  }
  // Production uses Railway environment variables, no .env file needed
}

// Initialize client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Command collection
const commands = new Collection<string, Command>();

// Load commands
const commandsPath = join(process.cwd(), "src/commands");
const commandFiles = readdirSync(commandsPath).filter((file) =>
  file.endsWith(".ts")
);

for (const file of commandFiles) {
  const filePath = join(commandsPath, file);
  const commandModule = await import(filePath);
  const command = commandModule.default as Command | undefined;
  if (
    command &&
    "data" in command &&
    "execute" in command &&
    typeof command.execute === "function"
  ) {
    commands.set(command.data.name, command);
  }
}

// Register commands with Discord (auto-register on startup)
async function registerCommands() {
  try {
    const env = process.env.NODE_ENV === "development" ? "[DEV]" : "[PROD]";
    console.log(`${env} 📝 Registering Discord commands...`);

    const commandsToRegister = Array.from(commands.values()).map((cmd) =>
      cmd.data.toJSON()
    );

    const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
    const clientId = process.env.DISCORD_APP_ID!;
    const guildId = process.env.DISCORD_GUILD_ID;

    // Register globally so commands work in all servers
    await rest.put(Routes.applicationCommands(clientId), {
      body: commandsToRegister,
    });
    console.log(
      `${env} ✅ Registered ${commandsToRegister.length} commands globally`
    );

    // Also register for specific guild if provided (for faster testing in dev)
    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commandsToRegister,
      });
      console.log(
        `${env} ✅ Also registered ${commandsToRegister.length} commands for guild ${guildId} (instant update)`
      );
    }
  } catch (error) {
    const env = process.env.NODE_ENV === "development" ? "[DEV]" : "[PROD]";
    console.error(
      `${env} ⚠️  Failed to register commands, continuing anyway:`,
      error
    );
    // Don't exit - let the bot start even if command registration fails
  }
}

// Register commands before starting the bot
await registerCommands();

// Ready event (using clientReady for future compatibility)
client.once("ready", () => {
  const env = process.env.NODE_ENV === "development" ? "[DEV]" : "[PROD]";
  console.log(`${env} ✅ Logged in as ${client.user?.tag}!`);
  console.log(`${env} 📊 Bot is in ${client.guilds.cache.size} guild(s)`);
});
// Also listen to clientReady for v15 compatibility
client.once("clientReady", () => {
  const env = process.env.NODE_ENV === "development" ? "[DEV]" : "[PROD]";
  console.log(`${env} ✅ Client ready!`);
});

// Message event - check for emote triggers
client.on(Events.MessageCreate, async (message) => {
  await handleEmoteMessage(message);
});

// Interaction event
client.on("interactionCreate", async (interaction) => {
  const env = process.env.NODE_ENV === "development" ? "[DEV]" : "[PROD]";

  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = commands.get(interaction.commandName);

  if (!command) {
    console.error(
      `${env} ❌ No command matching ${interaction.commandName} was found.`
    );
    console.error(
      `${env} Available commands: ${Array.from(commands.keys()).join(", ")}`
    );
    // Try to reply if possible, but don't fail if interaction expired
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: `Command "${interaction.commandName}" not found.`,
          flags: 64, // Ephemeral
        });
      }
    } catch (e) {
      // Ignore errors if interaction expired
    }
    return;
  }

  try {
    // Execute command - it should reply within 3 seconds
    await command.execute(interaction);
  } catch (error: any) {
    console.error(
      `${env} ❌ Error executing ${interaction.commandName}:`,
      error
    );

    // Only try to send error if interaction hasn't been replied to
    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({
          content: "There was an error while executing this command!",
          flags: 64, // Ephemeral
        });
      } catch (replyError: any) {
        // If interaction expired or already replied, just log it
        if (
          replyError.code !== 10062 &&
          !replyError.message?.includes("already")
        ) {
          console.error(`${env} ❌ Failed to send error reply:`, replyError);
        }
      }
    } else if (interaction.replied || interaction.deferred) {
      // If already replied/deferred, use followUp
      try {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          flags: 64, // Ephemeral
        });
      } catch (e) {
        // Ignore followUp errors
      }
    }
  }
});

// Start bot
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("❌ DISCORD_TOKEN environment variable is not set!");
  process.exit(1);
}

await client.login(token);

// Graceful shutdown
const shutdown = async () => {
  console.log("Shutting down gracefully...");
  client.destroy();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
