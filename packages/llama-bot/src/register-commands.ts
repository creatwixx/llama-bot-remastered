import { REST, Routes } from 'discord.js'
import { readdirSync } from 'fs'
import { join } from 'path'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from infra/.env
config({ path: resolve(process.cwd(), '../../infra/.env') })

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
    `Started refreshing ${commands.length} application (/) commands.`
  )

  // Register commands (guild-scoped for dev, global for production)
  if (guildId) {
    const data: any = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    )
    console.log(
      `Successfully reloaded ${data.length} application (/) commands for guild ${guildId}.`
    )
  } else {
    const data: any = await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    })
    console.log(
      `Successfully reloaded ${data.length} application (/) commands globally.`
    )
  }
} catch (error) {
  console.error(error)
  process.exit(1)
}

