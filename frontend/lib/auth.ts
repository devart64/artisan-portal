'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export async function login(email: string, password: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error('Identifiants invalides')
  const { token } = await res.json() as { token: string }
  const store = await cookies()
  store.set('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600,
  })
}

export async function logout(): Promise<void> {
  const store = await cookies()
  store.delete('jwt')
  redirect('/login')
}

export async function getJwt(): Promise<string | undefined> {
  const store = await cookies()
  return store.get('jwt')?.value
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error("Erreur lors de l'inscription")
  const { token } = await res.json() as { token: string }
  const store = await cookies()
  store.set('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600,
  })
}
