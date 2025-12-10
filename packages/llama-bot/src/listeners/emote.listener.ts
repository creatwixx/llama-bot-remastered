import { Events, Message } from 'discord.js'
import { checkEmoteTriggers } from '../utils/api.js'

export async function handleEmoteMessage(message: Message): Promise<void> {
  // Ignore bot messages
  if (message.author.bot) return

  // Ignore empty messages
  if (!message.content || message.content.trim().length === 0) return

  try {
    const guildId = message.guildId || undefined
    const result = await checkEmoteTriggers(message.content, guildId)

    if (result.matches && result.emotes.length > 0) {
      // Send images for all matched emotes
      for (const emote of result.emotes) {
        try {
          // Send the image URL as a message
          await message.channel.send({
            content: emote.imageUrl,
          })
        } catch (error) {
          console.warn(`Failed to send image ${emote.imageUrl}:`, error)
        }
      }
    }
  } catch (error) {
    console.error('Error in emote listener:', error)
    // Don't throw - we don't want to break message handling if emote check fails
  }
}

