// Startup script for Railway that registers commands then starts the bot
import { REST, Routes } from 'discord.js'
import { readdirSync } from 'fs'
import { join } from 'path'

console.log('🚀 Starting bot service...')

// Register commands first
try {
  console.log('📝 Registering Discord commands...')
  
  const commands: any[] = []
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

  const rest = new REST().setToken(process.env.DISCORD_TOKEN!)
  const clientId = process.env.DISCORD_APP_ID!
  const guildId = process.env.DISCORD_GUILD_ID

  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    })
    console.log(`✅ Registered ${commands.length} commands for guild ${guildId}`)
  } else {
    await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    })
    console.log(`✅ Registered ${commands.length} commands globally`)
  }
} catch (error) {
  console.error('⚠️  Failed to register commands, continuing anyway:', error)
  // Don't exit - let the bot start even if command registration fails
}

// Start the bot
console.log('🤖 Starting Discord bot...')
await import('./index.js')

