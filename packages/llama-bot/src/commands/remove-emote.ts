import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js'
import { getEmotes, deleteEmote } from '../utils/api.js'

export default {
  data: new SlashCommandBuilder()
    .setName('remove-emote')
    .setDescription('Remove an emote by trigger text')
    .addStringOption((option) =>
      option
        .setName('trigger')
        .setDescription('The trigger text of the emote to remove')
        .setRequired(true)
        .setAutocomplete(true)
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
    const guildId = interaction.guildId

    try {
      // First, find the emote by trigger
      const result = await getEmotes(guildId)
      const emotes = result.emotes || []

      // Find emotes matching the trigger (case-insensitive)
      const matchingEmotes = emotes.filter(
        (emote: any) => emote.trigger.toLowerCase() === trigger.toLowerCase()
      )

      if (matchingEmotes.length === 0) {
        await interaction.reply({
          content: `❌ No emote found with trigger "${trigger}"`,
          ephemeral: true,
        })
        return
      }

      // If multiple matches, delete the first one (or could let user choose)
      const emoteToDelete = matchingEmotes[0]

      await deleteEmote(emoteToDelete.id)

      await interaction.reply({
        content: `✅ Image trigger removed! Trigger: "${emoteToDelete.trigger}"`,
        ephemeral: true,
      })
    } catch (error: any) {
      console.error('Error removing emote:', error)
      await interaction.reply({
        content: `❌ Failed to remove emote: ${error.message || 'Unknown error'}`,
        ephemeral: true,
      })
    }
  },
}

