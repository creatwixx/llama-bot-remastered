// Register commands for Railway production
// This script uses environment variables from Railway (no .env file needed)

import { REST, Routes } from 'discord.js'
import { readdirSync } from 'fs'
import { join } from 'path'

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

try {
  console.log(
    `[RAILWAY] Started refreshing ${commands.length} application (/) commands.`
  )

  // Register commands (guild-scoped if guildId is set, global otherwise)
  if (guildId) {
    const data: any = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    )
    console.log(
      `[RAILWAY] Successfully reloaded ${data.length} application (/) commands for guild ${guildId}.`
    )
  } else {
    const data: any = await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    })
    console.log(
      `[RAILWAY] Successfully reloaded ${data.length} application (/) commands globally.`
    )
  }
  
  console.log('[RAILWAY] Command registration complete!')
  process.exit(0)
} catch (error) {
  console.error('[RAILWAY] Error registering commands:', error)
  process.exit(1)
}

