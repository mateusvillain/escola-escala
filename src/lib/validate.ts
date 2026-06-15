import { NextResponse } from 'next/server'
import { z } from 'zod'

export function validateBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): T | NextResponse {
  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: result.error.format() },
      { status: 400 }
    )
  }
  return result.data
}
