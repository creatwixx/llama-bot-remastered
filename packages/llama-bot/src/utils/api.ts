// API client utility for communicating with llama-api

// Determine API URL based on environment
const getApiUrl = () => {
  // Explicit API_URL takes precedence (set in Railway or Docker)
  if (process.env.API_URL) {
    let url = process.env.API_URL.trim()
    // Handle Railway internal URLs - add protocol and port if missing
    if (url.includes('railway.internal')) {
      if (!url.startsWith('http')) {
        url = `http://${url}`
      }
      // Add port if not present (Railway internal URLs need explicit port)
      if (!url.includes(':3000') && !url.match(/:\d+$/)) {
        url = `${url}:3000`
      }
    }
    return url
  }
  
  // Fallback: Check for APP_URL (some Railway setups use this)
  if (process.env.APP_URL) {
    let url = process.env.APP_URL.trim()
    // Handle Railway internal URLs - add protocol and port if missing
    if (url.includes('railway.internal')) {
      if (!url.startsWith('http')) {
        url = `http://${url}`
      }
      // Add port if not present
      if (!url.includes(':3000') && !url.match(/:\d+$/)) {
        url = `${url}:3000`
      }
    } else if (!url.startsWith('http')) {
      url = `http://${url}`
    }
    return url
  }
  
  // Railway: Try Railway internal service name directly
  // Railway allows services to call each other by service name
  if (process.env.RAILWAY_ENVIRONMENT) {
    // Try using the service name directly (Railway private networking)
    return 'http://llama-api.railway.internal:3000'
  }
  
  // Railway: Try to use service name if in Docker Compose deployment
  // Note: This only works if both services are deployed via docker-compose
  if (process.env.RAILWAY_ENVIRONMENT) {
    // If RAILWAY_ENVIRONMENT is set but no API_URL/APP_URL, we're likely in separate services
    console.error('[API] ❌ API_URL or APP_URL not set in Railway. Bot cannot connect to API.')
    console.error('[API] Please set API_URL environment variable in Railway bot service.')
    console.error('[API] Options:')
    console.error('[API]   1. Use public domain: https://your-api-service.up.railway.app')
    console.error('[API]   2. Use internal URL: http://llama-api.railway.internal:3000')
    throw new Error('API_URL or APP_URL environment variable is required. Set it in Railway bot service variables.')
  }
  
  // Docker Compose (local): use service name
  if (process.env.DOCKER_ENV || process.env.COMPOSE_PROJECT_NAME) {
    return 'http://api:3000'
  }
  
  // Local development (not in Docker)
  return 'http://localhost:3000'
}

const API_URL = getApiUrl()

// Log API URL for debugging (without exposing sensitive info)
if (process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug') {
  console.log(`[API] Using API URL: ${API_URL}`)
}

interface EmoteCheckResponse {
  matches: boolean
  emotes: Array<{
    id: string
    guildId: string | null
    trigger: string
    emote: string
    exactMatch: boolean
    enabled: boolean
  }>
}

export async function checkEmoteTriggers(
  message: string,
  guildId?: string
): Promise<EmoteCheckResponse> {
  try {
    const response = await fetch(`${API_URL}/emotes/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, guildId }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error checking emote triggers:', error)
    throw error
  }
}

export async function createEmote(data: {
  guildId?: string | null
  trigger: string
  imageUrl: string
  exactMatch?: boolean
  enabled?: boolean
  createdBy?: string
}) {
  try {
    const response = await fetch(`${API_URL}/emotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `API error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating emote:', error)
    throw error
  }
}

export async function getEmotes(guildId?: string, enabled?: boolean) {
  try {
    const params = new URLSearchParams()
    if (guildId) params.append('guildId', guildId)
    if (enabled !== undefined) params.append('enabled', enabled.toString())

    const response = await fetch(`${API_URL}/emotes?${params.toString()}`)

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching emotes:', error)
    throw error
  }
}

export async function deleteEmote(id: string) {
  try {
    const response = await fetch(`${API_URL}/emotes/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `API error: ${response.statusText}`)
    }

    return true
  } catch (error) {
    console.error('Error deleting emote:', error)
    throw error
  }
}

