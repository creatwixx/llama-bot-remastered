import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js'
import { readdirSync } from 'fs'
import { join } from 'path'
import './health.js'

// Initialize client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

// Command collection
const commands = new Collection()

// Load commands
const commandsPath = join(process.cwd(), 'src/commands')
const commandFiles = readdirSync(commandsPath).filter((file) =>
  file.endsWith('.ts')
)

for (const file of commandFiles) {
  const filePath = join(commandsPath, file)
  const command = await import(filePath)
  if (command.default && 'data' in command.default && 'execute' in command.default) {
    commands.set(command.default.data.name, command.default)
  }
}

// Ready event (using clientReady for future compatibility)
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user?.tag}!`)
  console.log(`📊 Bot is in ${client.guilds.cache.size} guild(s)`)
})
// Also listen to clientReady for v15 compatibility
client.once('clientReady', () => {
  console.log(`✅ Client ready!`)
})

// Interaction event
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  const command = commands.get(interaction.commandName)

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`)
    return
  }

  try {
    await command.execute(interaction)
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error)
    await interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true,
    })
  }
})

// Start bot
const token = process.env.DISCORD_TOKEN
if (!token) {
  console.error('❌ DISCORD_TOKEN environment variable is not set!')
  process.exit(1)
}

await client.login(token)

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down gracefully...')
  client.destroy()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

