import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'
import { getEmotes } from '../utils/api.js'

export default {
  data: new SlashCommandBuilder()
    .setName('list-emotes')
    .setDescription('List all emotes for this server')
    .addBooleanOption((option) =>
      option
        .setName('enabled-only')
        .setDescription('Show only enabled emotes (default: true)')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const enabledOnly = interaction.options.getBoolean('enabled-only') ?? true
    const guildId = interaction.guildId || undefined

    try {
      const result = await getEmotes(guildId, enabledOnly ? true : undefined)
      const emotes = result.emotes || []

      if (emotes.length === 0) {
        await interaction.reply({
          content: 'No emotes found for this server.',
          ephemeral: true,
        })
        return
      }

      // Create embed with emote list
      const embed = new EmbedBuilder()
        .setTitle(`📋 Emotes (${emotes.length})`)
        .setColor(0x5865f2)
        .setDescription(
          emotes
            .slice(0, 25) // Discord embed limit
            .map(
              (emote: any) =>
                `**${emote.trigger}** → [Image] ${emote.exactMatch ? '(exact)' : ''} ${emote.enabled ? '✅' : '❌'}`
            )
            .join('\n')
        )
        .setFooter({
          text: emotes.length > 25 ? `Showing 25 of ${emotes.length} emotes` : `Total: ${emotes.length}`,
        })

      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      })
    } catch (error: any) {
      console.error('Error listing emotes:', error)
      await interaction.reply({
        content: `❌ Failed to list emotes: ${error.message || 'Unknown error'}`,
        ephemeral: true,
      })
    }
  },
}

