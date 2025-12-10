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
      } catch (e) {
        // If URL parsing fails, try simple string manipulation
        if (!url.match(/:\d+(\/|$)/)) {
          // Add port before any path or at the end
          if (url.includes('/')) {
            url = url.replace('/', ':3000/')
          } else {
            url = `${url}:3000`
          }
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
      } catch (e) {
        // If URL parsing fails, try simple string manipulation
        if (!url.match(/:\d+(\/|$)/)) {
          // Add port before any path or at the end
          if (url.includes('/')) {
            url = url.replace('/', ':3000/')
          } else {
            url = `${url}:3000`
          }
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
  console.log(`[API] ✅ Using API URL: ${maskedUrl}`)
  
  // Validate URL can be used with fetch
  try {
    new URL(API_URL)
  } catch (e) {
    console.error(`[API] ❌ Invalid URL format: ${API_URL}`)
    throw new Error(`Invalid API URL format: ${API_URL}. Must be a valid URL.`)
  }
} catch (error) {
  console.error('[API] ❌ Failed to determine API URL:', error instanceof Error ? error.message : error)
  console.error('[API] Environment variables:')
  console.error(`[API]   API_URL: ${process.env.API_URL || '(not set)'}`)
  console.error(`[API]   APP_URL: ${process.env.APP_URL || '(not set)'}`)
  console.error(`[API]   RAILWAY_ENVIRONMENT: ${process.env.RAILWAY_ENVIRONMENT || '(not set)'}`)
  console.error(`[API]   DOCKER_ENV: ${process.env.DOCKER_ENV || '(not set)'}`)
  console.error(`[API]   COMPOSE_PROJECT_NAME: ${process.env.COMPOSE_PROJECT_NAME || '(not set)'}`)
  throw error
}

// Helper to safely construct API endpoint URLs
function buildApiUrl(endpoint: string): string {
  if (!API_URL) {
    throw new Error('API_URL is not set. Please configure API_URL environment variable.')
  }
  
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  
  // Ensure API_URL doesn't end with a slash
  const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL
  
  const fullUrl = `${baseUrl}/${cleanEndpoint}`
  
  // Validate the constructed URL
  try {
    new URL(fullUrl)
    return fullUrl
  } catch (e) {
    console.error(`[API] ❌ Invalid URL constructed: ${fullUrl}`)
    console.error(`[API] Base API_URL: ${API_URL}`)
    console.error(`[API] Endpoint: ${endpoint}`)
    throw new Error(`Invalid API URL constructed: ${fullUrl}`)
  }
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
    const url = buildApiUrl('emotes/check')
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, guildId }),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('fetch') || errorMessage.includes('URL') || errorMessage.includes('Invalid')) {
      console.error(`[API] ❌ Connection error. API_URL: ${API_URL}`)
      console.error(`[API] Error details:`, errorMessage)
      throw new Error(`Failed to connect to API at ${API_URL}. Please check API_URL environment variable in Railway.`)
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
    const url = buildApiUrl('emotes')
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || `API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('fetch') || errorMessage.includes('URL') || errorMessage.includes('Invalid')) {
      console.error(`[API] ❌ Connection error. API_URL: ${API_URL}`)
      console.error(`[API] Error details:`, errorMessage)
      throw new Error(`Failed to connect to API at ${API_URL}. Please check API_URL environment variable in Railway.`)
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

    const baseUrl = buildApiUrl('emotes')
    const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl

    console.log(`[API] Fetching: ${url.replace(/https?:\/\/([^@]+)@/, 'https://***@')}`)
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('fetch') || errorMessage.includes('URL') || errorMessage.includes('Invalid')) {
      console.error(`[API] ❌ Connection error. API_URL: ${API_URL}`)
      console.error(`[API] Error details:`, errorMessage)
      throw new Error(`Failed to connect to API at ${API_URL}. Please check API_URL environment variable in Railway.`)
    }
    console.error('Error fetching emotes:', error)
    throw error
  }
}

export async function deleteEmote(id: string) {
  try {
    const url = buildApiUrl(`emotes/${id}`)
    
    const response = await fetch(url, {
      method: 'DELETE',
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || `API error: ${response.status} ${response.statusText}`)
    }

    return true
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('fetch') || errorMessage.includes('URL') || errorMessage.includes('Invalid')) {
      console.error(`[API] ❌ Connection error. API_URL: ${API_URL}`)
      console.error(`[API] Error details:`, errorMessage)
      throw new Error(`Failed to connect to API at ${API_URL}. Please check API_URL environment variable in Railway.`)
    }
    console.error('Error deleting emote:', error)
    throw error
  }
}

