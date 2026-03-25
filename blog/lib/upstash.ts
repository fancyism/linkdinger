export interface UpstashRestConfig {
  url?: string;
  token?: string;
}

type UpstashFetchOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  revalidate?: number;
};

export function getUpstashRestConfig(): UpstashRestConfig {
  return {
    url:
      process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL ||
      process.env.UPSTASH_REDIS_REST_URL,
    token:
      process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN ||
      process.env.UPSTASH_REDIS_REST_TOKEN,
  };
}

export async function fetchUpstashJson<T>(
  path: string,
  options: UpstashFetchOptions = {},
): Promise<T | null> {
  const { url, token } = getUpstashRestConfig();

  if (!url || !token) {
    return null;
  }

  const response = await fetch(`${url}${path}`, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    ...(options.revalidate !== undefined
      ? { next: { revalidate: options.revalidate } }
      : {}),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}
