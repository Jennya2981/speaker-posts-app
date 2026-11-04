import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const speakers = await db.speaker.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(speakers)
}

export async function POST(request: Request) {
  try {
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