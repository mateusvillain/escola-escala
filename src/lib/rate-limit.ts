import { NextRequest } from 'next/server'

interface Entry {
  count: number
  resetAt: number
}

// In-memory store — resets on each deploy, adequate for Fase 1
const store = new Map<string, Entry>()

interface RateLimitOptions {
  limit: number
  windowMs: number
}

interface RateLimitResult {
  limited: boolean
  retryAfter: number
}

export function rateLimit(ip: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + options.windowMs })
    return { limited: false, retryAfter: 0 }
  }

  entry.count++

  if (entry.count > options.limit) {
    return { limited: true, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }

  return { limited: false, retryAfter: 0 }
}

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}
