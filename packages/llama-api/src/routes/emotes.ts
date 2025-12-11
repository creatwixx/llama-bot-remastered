import { FastifyInstance } from "fastify";
import { z } from "zod";
import prisma from "../prisma.js";

// Validation schemas
const createEmoteSchema = z.object({
  guildId: z.string().optional().nullable(),
  trigger: z.string().min(1),
  imageUrl: z.string().url("Must be a valid URL"),
  exactMatch: z.boolean().optional().default(false),
  enabled: z.boolean().optional().default(true),
  author: z.string().min(1, "Author is required"), // Discord username who created this emote
});

const updateEmoteSchema = z.object({
  trigger: z.string().min(1).optional(),
  imageUrl: z.string().url("Must be a valid URL").optional(),
  exactMatch: z.boolean().optional(),
  enabled: z.boolean().optional(),
});

const queryEmoteSchema = z.object({
  guildId: z.string().optional(),
  enabled: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (typeof val === "boolean") return val;
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    }),
});

export default async function emoteRoutes(fastify: FastifyInstance) {
  // Get all emotes (with optional filters)
  fastify.get("/emotes", async (request, reply) => {
    try {
      const query = queryEmoteSchema.parse(request.query);
      const where: any = {};

      if (query.guildId !== undefined) {
        where.guildId = query.guildId;
      }
      if (query.enabled !== undefined) {
        where.enabled = query.enabled;
      }

      const emotes = await prisma.emote.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      return { emotes };
    } catch (error: any) {
      fastify.log.error("Error fetching emotes:", error);
      return reply.code(500).send({
        error: "Failed to fetch emotes",
        message: error.message || "Unknown error",
      });
    }
  });

  // Get emote by ID
  fastify.get("/emotes/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const emote = await prisma.emote.findUnique({
      where: { id },
    });

    if (!emote) {
      return reply.code(404).send({ error: "Emote not found" });
    }

    return { emote };
  });

  // Create new emote
  fastify.post("/emotes", async (request, reply) => {
    const data = createEmoteSchema.parse(request.body);

    try {
      const emote = await prisma.emote.create({
        data: {
          guildId: data.guildId ?? null,
          trigger: data.trigger,
          imageUrl: data.imageUrl,
          exactMatch: data.exactMatch,
          enabled: data.enabled,
          author: data.author, // Required - Discord username who created this emote
        },
      });

      return reply.code(201).send({ emote });
    } catch (error: any) {
      // Handle unique constraint violation (duplicate trigger)
      if (error.code === "P2002") {
        const scope = data.guildId ? "this server" : "globally";
        return reply.code(409).send({
          error: "Emote already exists",
          message: `An emote with trigger "${data.trigger}" already exists ${scope}.`,
        });
      }
      throw error;
    }
  });

  // Update emote
  fastify.patch("/emotes/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = updateEmoteSchema.parse(request.body);

    try {
      const emote = await prisma.emote.update({
        where: { id },
        data,
      });

      return { emote };
    } catch (error: any) {
      if (error.code === "P2025") {
        return reply.code(404).send({ error: "Emote not found" });
      }
      throw error;
    }
  });

  // Delete emote
  fastify.delete("/emotes/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await prisma.emote.delete({
        where: { id },
      });

      return reply.code(204).send();
    } catch (error: any) {
      if (error.code === "P2025") {
        return reply.code(404).send({ error: "Emote not found" });
      }
      throw error;
    }
  });

  // Check if message matches any emote triggers
  fastify.post("/emotes/check", async (request, reply) => {
    const { message, guildId } = request.body as {
      message: string;
      guildId?: string;
    };

    if (!message || typeof message !== "string") {
      return reply.code(400).send({ error: "Message is required" });
    }

    // Build where clause: get guild-specific and global emotes
    const where: any = {
      enabled: true,
      OR: [
        { guildId: null }, // Global emotes
      ],
    };

    if (guildId) {
      where.OR.push({ guildId });
    }

    const emotes = await prisma.emote.findMany({
      where,
    });

    // Check for matches
    const messageLower = message.toLowerCase();
    const matchedEmotes: any[] = [];

    for (const emote of emotes) {
      const triggerLower = emote.trigger.toLowerCase();
      let matches = false;

      if (emote.exactMatch) {
        matches = messageLower === triggerLower;
      } else {
        matches = messageLower.includes(triggerLower);
      }

      if (matches) {
        matchedEmotes.push(emote);
        // Increment use count
        await prisma.emote.update({
          where: { id: emote.id },
          data: { useCount: { increment: 1 } },
        });
      }
    }

    return {
      matches: matchedEmotes.length > 0,
      emotes: matchedEmotes,
    };
  });
}
