// API client utility for communicating with llama-api

// In Docker, use service name 'api', otherwise use localhost or API_URL env var
const getApiUrl = () => {
  if (process.env.API_URL) {
    return process.env.API_URL
  }
  // In Docker network, use service name
  if (process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV) {
    return 'http://api:3000'
  }
  // Local development
  return 'http://localhost:3000'
}

const API_URL = getApiUrl()

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

