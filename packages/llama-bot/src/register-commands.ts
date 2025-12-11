// Register Discord slash commands
// Automatically detects environment (Railway, local dev, etc.) and loads appropriate config

import { REST, Routes } from 'discord.js'
import { readdirSync } from 'fs'
import { join } from 'path'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables based on environment
if (process.env.RAILWAY_ENVIRONMENT) {
  // Railway: Use environment variables directly (no .env file needed)
  console.log('[RAILWAY] Using Railway environment variables')
} else {
  // Local development: Load from .env.local
  const envPath = resolve(process.cwd(), '../../infra/.env.local')
  config({ path: envPath })
  console.log(`[DEV] Loaded environment from ${envPath}`)
}

const commands: any[] = []

// Load commands
const commandsPath = join(process.cwd(), 'src/commands')
const commandFiles = readdirSync(commandsPath).filter((file) =>
  file.endsWith('.ts')
)

for (const file of commandFiles) {
  const filePath = join(commandsPath, file)
  const command = await import(filePath)
  if (command.default?.data) {
    commands.push(command.default.data.toJSON())
  }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN!)

const clientId = process.env.DISCORD_APP_ID!
const guildId = process.env.DISCORD_GUILD_ID // Optional, for guild commands

const envPrefix = process.env.RAILWAY_ENVIRONMENT ? '[RAILWAY]' : '[DEV]'

try {
  console.log(
    `${envPrefix} Started refreshing ${commands.length} application (/) commands.`
  )

  // Register commands (guild-scoped if guildId is set, global otherwise)
  if (guildId) {
    const data: any = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    )
    console.log(
      `${envPrefix} Successfully reloaded ${data.length} application (/) commands for guild ${guildId}.`
    )
  } else {
    const data: any = await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    })
    console.log(
      `${envPrefix} Successfully reloaded ${data.length} application (/) commands globally.`
    )
  }
  
  console.log(`${envPrefix} Command registration complete!`)
  process.exit(0)
} catch (error) {
  console.error(`${envPrefix} Error registering commands:`, error)
  process.exit(1)
}
