import { Message, EmbedBuilder } from "discord.js";
import { checkEmoteTriggers } from "../utils/api.js";

export async function handleEmoteMessage(message: Message): Promise<void> {
  // Ignore bot messages
  if (message.author.bot) return;

  // Ignore empty messages
  if (!message.content || message.content.trim().length === 0) return;

  try {
    const guildId = message.guildId || undefined;
    const result = await checkEmoteTriggers(message.content, guildId);

    if (result.matches && result.emotes.length > 0) {
      // Send images for all matched emotes
      // Only send if channel is a text-based channel that supports sending messages
      if (!message.channel.isTextBased()) {
        return;
      }

      // Type guard: PartialGroupDMChannel doesn't have send method
      // Check if channel has send method before using it
      const channel = message.channel;
      if (
        !("send" in channel) ||
        typeof (channel as { send?: unknown }).send !== "function"
      ) {
        return;
      }

      for (const emote of result.emotes) {
        try {
          // Create an embed with the image URL for proper GIF/image display
          const embed = new EmbedBuilder().setImage(emote.imageUrl);

          // Send the embed instead of plain text content
          // Type assertion is safe here because we checked for send method above
          await (
            channel as {
              send: (options: { embeds: EmbedBuilder[] }) => Promise<unknown>;
            }
          ).send({
            embeds: [embed],
          });
        } catch (error) {
          console.warn(`Failed to send image ${emote.imageUrl}:`, error);
        }
      }
    }
  } catch (error) {
    console.error("Error in emote listener:", error);
    // Don't throw - we don't want to break message handling if emote check fails
  }
}
