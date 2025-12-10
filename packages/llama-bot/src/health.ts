// Simple HTTP health check server for the bot
// Railway uses PORT, fallback to BOT_PORT or 8080
const port = parseInt(process.env.PORT || process.env.BOT_PORT || '8080', 10)

const server = Bun.serve({
  port,
  fetch(request: Request) {
    if (request.url.endsWith('/health')) {
      return new Response(
        JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
    return new Response('Not Found', { status: 404 })
  },
})

console.log(`🏥 Bot health server listening on port ${port}`)

