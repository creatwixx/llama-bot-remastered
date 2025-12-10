import Fastify from 'fastify'
import cors from '@fastify/cors'
import formbody from '@fastify/formbody'
import prisma from './prisma.js'
import emoteRoutes from './routes/emotes.js'
import commandRoutes from './routes/commands.js'

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
})

// Register plugins
await fastify.register(cors, {
  origin: true,
})

await fastify.register(formbody)

// Health check route
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// Register routes
await fastify.register(emoteRoutes)
await fastify.register(commandRoutes)

// Start server
// Railway uses PORT, fallback to API_PORT or 3000
const port = parseInt(process.env.PORT || process.env.API_PORT || '3000', 10)
const host = '0.0.0.0'

try {
  await fastify.listen({ port, host })
  fastify.log.info(`🚀 API server listening on ${host}:${port}`)
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}

// Graceful shutdown
const shutdown = async () => {
  fastify.log.info('Shutting down gracefully...')
  await fastify.close()
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

