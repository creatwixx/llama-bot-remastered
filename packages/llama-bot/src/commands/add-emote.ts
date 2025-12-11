import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js'
import { createEmote } from '../utils/api.js'

export default {
  data: new SlashCommandBuilder()
    .setName('add-emote')
    .setDescription('Add a new emote trigger')
    .addStringOption((option) =>
      option
        .setName('trigger')
        .setDescription('The text that will trigger this emote')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('image-url')
        .setDescription('The image URL to send when trigger matches')
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName('exact-match')
        .setDescription('Require exact match (default: false, checks if message contains trigger)')
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName('guild-only')
        .setDescription('Make this emote guild-specific (default: true)')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      await interaction.reply({
        content: 'This command can only be used in a server!',
        ephemeral: true,
      })
      return
    }

    const trigger = interaction.options.getString('trigger', true)
    const imageUrl = interaction.options.getString('image-url', true)
    const exactMatch = interaction.options.getBoolean('exact-match') ?? false
    const guildOnly = interaction.options.getBoolean('guild-only') ?? true

    // Validate URL
    try {
      new URL(imageUrl)
    } catch {
      await interaction.reply({
        content: '❌ Invalid URL. Please provide a valid image URL.',
        ephemeral: true,
      })
      return
    }

    try {
      const result = await createEmote({
        guildId: guildOnly ? interaction.guildId : null,
        trigger,
        imageUrl,
        exactMatch,
        enabled: true,
        author: interaction.user.username,
      })

      await interaction.reply({
        content: `✅ Image trigger added! Trigger: "${trigger}" → [Image]`,
        ephemeral: true,
      })
    } catch (error: any) {
      console.error('Error adding emote:', error)
      await interaction.reply({
        content: `❌ Failed to add emote: ${error.message || 'Unknown error'}`,
        ephemeral: true,
      })
    }
  },
}

