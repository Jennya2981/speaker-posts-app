import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureDb } from '@/lib/ensure-db'

export async function GET() {
  try {
    await ensureDb()
    const speakers = await db.speaker.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(speakers)
  } catch (error) {
    console.error('[api/speakers] GET', error)
    return NextResponse.json({ error: 'Не удалось загрузить спикеров' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await ensureDb()
    const body = await request.json()
    const name = (body.name ?? '').trim()
    if (!name) {
      return NextResponse.json({ error: 'Укажите имя спикера' }, { status: 400 })
    }
    const existing = await db.speaker.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json(existing)
    }
    const speaker = await db.speaker.create({ data: { name } })
    return NextResponse.json(speaker, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Не удалось добавить спикера' }, { status: 500 })
  }
}