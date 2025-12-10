// API client utility for communicating with llama-api

// Determine API URL based on environment
const getApiUrl = (): string => {
  // Explicit API_URL takes precedence (set in Railway or Docker)
  if (process.env.API_URL) {
    let url = process.env.API_URL.trim()
    if (!url) {
      throw new Error('API_URL is set but empty')
    }
    
    // Handle Railway internal URLs - add protocol and port if missing
    if (url.includes('railway.internal')) {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `http://${url}`
      }
      // Add port if not present (Railway internal URLs need explicit port)
      try {
        const urlObj = new URL(url)
        if (!urlObj.port) {
          urlObj.port = '3000'
          url = urlObj.toString()
        }
      } catch {
        // If URL parsing fails, try simple string manipulation
        if (!url.match(/:\d+(\/|$)/)) {
          url = url.endsWith('/') ? url.replace(/\//, ':3000/') : `${url}:3000`
        }
      }
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // For non-railway URLs, add http:// if missing
      url = `http://${url}`
    }
    
    // Validate URL format
    try {
      new URL(url)
      return url
    } catch (e) {
      throw new Error(`Invalid API_URL format: "${url}". Must be a valid URL (e.g., http://llama-api.railway.internal:3000)`)
    }
  }
  
  // Fallback: Check for APP_URL (some Railway setups use this)
  if (process.env.APP_URL) {
    let url = process.env.APP_URL.trim()
    if (!url) {
      throw new Error('APP_URL is set but empty')
    }
    
    // Handle Railway internal URLs - add protocol and port if missing
    if (url.includes('railway.internal')) {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `http://${url}`
      }
      // Add port if not present
      try {
        const urlObj = new URL(url)
        if (!urlObj.port) {
          urlObj.port = '3000'
          url = urlObj.toString()
        }
      } catch {
        // If URL parsing fails, try simple string manipulation
        if (!url.match(/:\d+(\/|$)/)) {
          url = url.endsWith('/') ? url.replace(/\//, ':3000/') : `${url}:3000`
        }
      }
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `http://${url}`
    }
    
    // Validate URL format
    try {
      new URL(url)
      return url
    } catch (e) {
      throw new Error(`Invalid APP_URL format: "${url}". Must be a valid URL`)
    }
  }
  
  // Railway: Try Railway internal service name directly
  // Railway allows services to call each other by service name
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

let API_URL: string
try {
  API_URL = getApiUrl()
  // Log API URL for debugging (mask sensitive parts)
  const maskedUrl = API_URL.replace(/https?:\/\/([^@]+)@/, 'https://***@')
  console.log(`[API] Using API URL: ${maskedUrl}`)
} catch (error) {
  console.error('[API] ❌ Failed to determine API URL:', error instanceof Error ? error.message : error)
  throw error
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
    const url = `${API_URL}/emotes/check`
    if (!url || !url.startsWith('http')) {
      throw new Error(`Invalid API URL: ${url}`)
    }
    
    const response = await fetch(url, {
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
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('fetch') || errorMessage.includes('URL')) {
      console.error(`[API] Connection error. API_URL: ${API_URL}`)
      throw new Error(`Failed to connect to API. Check API_URL configuration.`)
    }
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
    const url = `${API_URL}/emotes`
    if (!url || !url.startsWith('http')) {
      throw new Error(`Invalid API URL: ${url}`)
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || `API error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('fetch') || errorMessage.includes('URL')) {
      console.error(`[API] Connection error. API_URL: ${API_URL}`)
      throw new Error(`Failed to connect to API. Check API_URL configuration.`)
    }
    console.error('Error creating emote:', error)
    throw error
  }
}

export async function getEmotes(guildId?: string, enabled?: boolean) {
  try {
    const params = new URLSearchParams()
    if (guildId) params.append('guildId', guildId)
    if (enabled !== undefined) params.append('enabled', enabled.toString())

    const url = `${API_URL}/emotes?${params.toString()}`
    if (!url || !url.startsWith('http')) {
      throw new Error(`Invalid API URL: ${url}`)
    }

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('fetch') || errorMessage.includes('URL')) {
      console.error(`[API] Connection error. API_URL: ${API_URL}`)
      throw new Error(`Failed to connect to API. Check API_URL configuration.`)
    }
    console.error('Error fetching emotes:', error)
    throw error
  }
}

export async function deleteEmote(id: string) {
  try {
    const url = `${API_URL}/emotes/${id}`
    if (!url || !url.startsWith('http')) {
      throw new Error(`Invalid API URL: ${url}`)
    }
    
    const response = await fetch(url, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || `API error: ${response.statusText}`)
    }

    return true
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('fetch') || errorMessage.includes('URL')) {
      console.error(`[API] Connection error. API_URL: ${API_URL}`)
      throw new Error(`Failed to connect to API. Check API_URL configuration.`)
    }
    console.error('Error deleting emote:', error)
    throw error
  }
}

