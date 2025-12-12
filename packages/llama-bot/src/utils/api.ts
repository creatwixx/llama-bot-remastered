// API client utility for communicating with llama-api

// Determine API URL based on environment
const getApiUrl = (): string => {
  // Explicit API_URL takes precedence
  if (process.env.API_URL) {
    let url = process.env.API_URL.trim();
    if (!url) {
      throw new Error("API_URL is set but empty");
    }

    // Add protocol if missing
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      // Detect internal service URLs (common patterns: .internal, .local, service names)
      // Use http for internal services, https for public URLs
      const isInternalUrl =
        url.includes(".internal") ||
        url.includes(".local") ||
        url.match(/^[a-z-]+:\d+$/) || // service:port format
        !url.includes("."); // no dots = likely internal service name

      url = isInternalUrl ? `http://${url}` : `https://${url}`;
    }

    // Add default port for internal service URLs if missing
    // Common internal URL patterns: service-name, service-name.internal, etc.
    if (
      (url.includes(".internal") ||
        url.includes(".local") ||
        !url.includes(".")) &&
      !url.match(/:\d+/)
    ) {
      url = `${url}:3000`;
    }

    return url;
  }

  // Fallback: Check for APP_URL
  if (process.env.APP_URL) {
    let url = process.env.APP_URL.trim();
    if (!url) {
      throw new Error("APP_URL is set but empty");
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      const isInternalUrl =
        url.includes(".internal") ||
        url.includes(".local") ||
        url.match(/^[a-z-]+:\d+$/) ||
        !url.includes(".");

      url = isInternalUrl ? `http://${url}` : `https://${url}`;
    }

    if (
      (url.includes(".internal") ||
        url.includes(".local") ||
        !url.includes(".")) &&
      !url.match(/:\d+/)
    ) {
      url = `${url}:3000`;
    }

    return url;
  }

  // Production/Deployed: API_URL must be set
  if (process.env.NODE_ENV === "production") {
    console.error(
      "[API] ❌ API_URL not set in production. Please set API_URL environment variable."
    );
    throw new Error("API_URL environment variable is required in production");
  }

  // Docker Compose (local development)
  if (process.env.DOCKER_ENV || process.env.COMPOSE_PROJECT_NAME) {
    return "http://api:3000";
  }

  // Local development (no Docker)
  return "http://localhost:3000";
};

const API_URL = getApiUrl();
console.log(`[API] Using API URL: ${API_URL}`);

// Helper to construct API endpoint URLs
function buildApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
  return `${baseUrl}/${cleanEndpoint}`;
}

interface Emote {
  id: string;
  guildId: string | null;
  trigger: string;
  imageUrl: string;
  exactMatch: boolean;
  enabled: boolean;
  useCount: number;
  createdAt: string;
  updatedAt: string;
  author: string;
}

interface EmoteCheckResponse {
  matches: boolean;
  emotes: Array<Emote>;
}

interface GetEmotesResponse {
  emotes: Array<Emote>;
}

interface CreateEmoteResponse {
  emote: Emote;
}

export async function checkEmoteTriggers(
  message: string,
  guildId?: string
): Promise<EmoteCheckResponse> {
  try {
    const url = buildApiUrl("emotes/check");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, guildId }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as EmoteCheckResponse;
  } catch (error) {
    console.error(
      `[API] Error checking emote triggers from ${API_URL}:`,
      error
    );
    throw error;
  }
}

export async function createEmote(data: {
  guildId?: string | null;
  trigger: string;
  imageUrl: string;
  exactMatch?: boolean;
  enabled?: boolean;
  author: string;
}): Promise<CreateEmoteResponse> {
  try {
    const url = buildApiUrl("emotes");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const error = (await response
        .json()
        .catch(() => ({ error: response.statusText }))) as {
        error?: string;
        message?: string;
      };
      throw new Error(
        error.message ||
          error.error ||
          `API error: ${response.status} ${response.statusText}`
      );
    }

    return (await response.json()) as CreateEmoteResponse;
  } catch (error) {
    console.error(`[API] Error creating emote at ${API_URL}:`, error);
    throw error;
  }
}

export async function getEmotes(
  guildId?: string,
  enabled?: boolean
): Promise<GetEmotesResponse> {
  try {
    const params = new URLSearchParams();
    if (guildId) params.append("guildId", guildId);
    if (enabled !== undefined) params.append("enabled", enabled.toString());

    const baseUrl = buildApiUrl("emotes");
    const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as GetEmotesResponse;
  } catch (error) {
    console.error(`[API] Error fetching emotes from ${API_URL}:`, error);
    throw error;
  }
}

export async function deleteEmote(id: string) {
  try {
    const url = buildApiUrl(`emotes/${id}`);

    const response = await fetch(url, {
      method: "DELETE",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const error = (await response
        .json()
        .catch(() => ({ error: response.statusText }))) as {
        error?: string;
        message?: string;
      };
      throw new Error(
        error.message ||
          error.error ||
          `API error: ${response.status} ${response.statusText}`
      );
    }

    return true;
  } catch (error) {
    console.error(`[API] Error deleting emote at ${API_URL}:`, error);
    throw error;
  }
}
