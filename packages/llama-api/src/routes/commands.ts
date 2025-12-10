import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import prisma from '../prisma.js'

// Validation schemas
const createCommandSchema = z.object({
  guildId: z.string().optional().nullable(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  response: z.string().min(1),
  enabled: z.boolean().optional().default(true),
  createdBy: z.string().optional().nullable(),
})

const updateCommandSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  response: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
})

const queryCommandSchema = z.object({
  guildId: z.string().optional(),
  enabled: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined
      if (typeof val === 'boolean') return val
      if (val === 'true') return true
      if (val === 'false') return false
      return undefined
    }),
})

export default async function commandRoutes(fastify: FastifyInstance) {
  // Get all commands (with optional filters)
  fastify.get('/commands', async (request, reply) => {
    const query = queryCommandSchema.parse(request.query)
    const where: any = {}

    if (query.guildId !== undefined) {
      where.guildId = query.guildId
    }
    if (query.enabled !== undefined) {
      where.enabled = query.enabled
    }

    const commands = await prisma.command.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return { commands }
  })

  // Get command by ID
  fastify.get('/commands/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    const command = await prisma.command.findUnique({
      where: { id },
    })

    if (!command) {
      return reply.code(404).send({ error: 'Command not found' })
    }

    return { command }
  })

  // Get command by name and guildId
  fastify.get('/commands/name/:name', async (request, reply) => {
    const { name } = request.params as { name: string }
    const { guildId } = request.query as { guildId?: string }

    const command = await prisma.command.findFirst({
      where: {
        guildId: guildId ?? null,
        name,
      },
    })

    if (!command) {
      return reply.code(404).send({ error: 'Command not found' })
    }

    return { command }
  })

  // Create new command
  fastify.post('/commands', async (request, reply) => {
    const data = createCommandSchema.parse(request.body)

    try {
      const command = await prisma.command.create({
        data: {
          guildId: data.guildId ?? null,
          name: data.name,
          description: data.description ?? null,
          response: data.response,
          enabled: data.enabled,
          createdBy: data.createdBy ?? null,
        },
      })

      return reply.code(201).send({ command })
    } catch (error: any) {
      if (error.code === 'P2002') {
        return reply
          .code(409)
          .send({ error: 'Command with this name already exists for this guild' })
      }
      throw error
    }
  })

  // Update command
  fastify.patch('/commands/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = updateCommandSchema.parse(request.body)

    try {
      const command = await prisma.command.update({
        where: { id },
        data,
      })

      return { command }
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Command not found' })
      }
      throw error
    }
  })

  // Delete command
  fastify.delete('/commands/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    try {
      await prisma.command.delete({
        where: { id },
      })

      return reply.code(204).send()
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Command not found' })
      }
      throw error
    }
  })

  // Execute command (increment use count and return response)
  fastify.post('/commands/:id/execute', async (request, reply) => {
    const { id } = request.params as { id: string }

    try {
      const command = await prisma.command.findUnique({
        where: { id },
      })

      if (!command) {
        return reply.code(404).send({ error: 'Command not found' })
      }

      if (!command.enabled) {
        return reply.code(403).send({ error: 'Command is disabled' })
      }

      // Increment use count
      const updatedCommand = await prisma.command.update({
        where: { id },
        data: { useCount: { increment: 1 } },
      })

      return {
        command: updatedCommand,
        response: command.response,
      }
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Command not found' })
      }
      throw error
    }
  })
}

