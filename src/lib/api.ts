// Lightweight fetch wrapper for backend API access
// Usage: const users = await api.get<User[]>("/search/users?q=alice");

const baseURL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:4001/api";

type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

async function request<T = unknown>(
  method: HTTPMethod,
  path: string,
  body?: any,
  opts: RequestOptions = {}
): Promise<T> {
  const url = buildUrl(path, opts.query);
  const init: RequestInit = {
    method,
    credentials: "include", // ensure cookies (JWT) are sent
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(opts.headers || {}),
    },
    signal: opts.signal,
    body: body ? JSON.stringify(body) : undefined,
  };

  const res = await fetch(url, init);
  const isJson = res.headers.get("content-type")?.includes("application/json");

  let data: any = null;
  if (isJson) {
    try {
      data = await res.json();
    } catch {
      // ignore JSON parse error (e.g., 204 no content)
    }
  } else if (res.status !== 204) {
    data = await res.text().catch(() => null);
  }

  if (!res.ok) {
    const message =
      (data && (data.error || data.message)) ||
      res.statusText ||
      "Request failed";
    const error = new Error(message) as Error & { status?: number; data?: any };
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  let full =
    path.startsWith("http://") || path.startsWith("https://")
      ? path
      : baseURL.replace(/\/$/, "") + (path.startsWith("/") ? path : `/${path}`);
  if (query) {
    const qs = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(
        ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
      )
      .join("&");
    if (qs) full += (full.includes("?") ? "&" : "?") + qs;
  }
  return full;
}

export const api = {
  get: <T = unknown>(path: string, opts?: RequestOptions) =>
    request<T>("GET", path, undefined, opts),
  post: <T = unknown>(path: string, body?: any, opts?: RequestOptions) =>
    request<T>("POST", path, body, opts),
  put: <T = unknown>(path: string, body?: any, opts?: RequestOptions) =>
    request<T>("PUT", path, body, opts),
  del: <T = unknown>(path: string, opts?: RequestOptions) =>
    request<T>("DELETE", path, undefined, opts),
};

export { baseURL };
