import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

function normalizeHashtags(raw: string): string {
  return raw
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith('#') ? t : `#${t}`))
    .join(' ')
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params
    await db.post.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Пост не найден' }, { status: 404 })
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const data: {
      title?: string
      content?: string
      hashtags?: string
      speakerId?: string | null
      status?: string
    } = {}

    if (typeof body.title === 'string') {
      if (!body.title.trim()) {
        return NextResponse.json({ error: 'Заголовок обязателен' }, { status: 400 })
      }
      data.title = body.title.trim()
    }
    if (typeof body.content === 'string') {
      if (!body.content.trim()) {
        return NextResponse.json({ error: 'Текст поста обязателен' }, { status: 400 })
      }
      data.content = body.content.trim()
    }
    if (typeof body.hashtags === 'string') {
      data.hashtags = normalizeHashtags(body.hashtags)
    }
    if (typeof body.speakerId === 'string' || body.speakerId === null) {
      data.speakerId = body.speakerId || null
    }
    if (body.status) {
      data.status = body.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED'
    }

    const post = await db.post.update({ where: { id }, data, include: { speaker: true } })
    return NextResponse.json(post)
  } catch {
    return NextResponse.json({ error: 'Пост не найден' }, { status: 404 })
  }
}