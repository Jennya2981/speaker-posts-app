import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureDb } from '@/lib/ensure-db'

export const dynamic = 'force-dynamic'

// Диагностика: /api/diag — проверяет чтение и запись в базу.
export async function GET() {
  const result: Record<string, unknown> = {
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    nodeEnv: process.env.NODE_ENV,
  }

  try {
    const url = process.env.DATABASE_URL ?? ''
    result.databaseUrlShape = {
      protocol: url.split(':')[0],
      hasHost: url.includes('@'),
      host: url.replace(/^.*@/, '').split('/')[0]?.split('?')[0],
      params: url.split('?')[1] ?? '',
      length: url.length,
    }
  } catch {
    // ignore
  }

  try {
    await ensureDb()
    result.read = { ok: true, speakers: await db.speaker.count() }
  } catch (error) {
    result.read = {
      ok: false,
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
    }
  }

  const probeName = `__diag__${Date.now()}`
  try {
    const created = await db.speaker.create({ data: { name: probeName } })
    await db.speaker.delete({ where: { id: created.id } })
    result.write = { ok: true }
  } catch (error) {
    const e = error as { name?: string; message?: string; code?: string; meta?: unknown }
    result.write = {
      ok: false,
      name: e?.name,
      message: e?.message,
      code: e?.code,
      meta: e?.meta,
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 6) : undefined,
    }
  }

  return NextResponse.json(result)
}
