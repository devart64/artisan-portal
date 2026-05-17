import { getJwt } from './auth'

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8001'

export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const jwt = await getJwt()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({})) as { message?: string }
    throw new APIError(res.status, error.message ?? 'Erreur API')
  }
  const data = await res.json()
  
  // Unwrap API Platform JSON-LD collections
  if (data && typeof data === 'object' && 'hydra:member' in data) {
    return data['hydra:member'] as Promise<T>
  }
  
  return data as Promise<T>
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const jwt = await getJwt()
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    body: formData,
    headers: {
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({})) as { message?: string }
    throw new APIError(res.status, error.message ?? 'Erreur upload')
  }
  return res.json() as Promise<T>
}
