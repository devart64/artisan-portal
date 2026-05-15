const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export class PortalError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'PortalError'
  }
}

export async function portalFetch<T>(
  token: string,
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}/api/portal/${token}${path}`, options)
  if (!res.ok) throw new PortalError(res.status, 'Accès refusé ou lien expiré')
  return res.json() as Promise<T>
}
