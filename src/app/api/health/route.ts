import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureDb } from '@/lib/ensure-db'

export const dynamic = 'force-dynamic'

// Проверка состояния приложения и базы данных.
// Открыть: /api/health
export async function GET() {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL)

  try {
    await ensureDb()
    const speakers = await db.speaker.count()
    const posts = await db.post.count()
    return NextResponse.json({
      ok: true,
      database: hasDatabaseUrl ? 'connected' : 'DATABASE_URL отсутствует',
      speakers,
      posts,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        database: hasDatabaseUrl ? 'error' : 'DATABASE_URL отсутствует',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
