import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureDb } from '@/lib/ensure-db'

export async function GET() {
  try {
    await ensureDb()
    const posts = await db.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: { speaker: true },
    })
    return NextResponse.json(posts)
  } catch (error) {
    console.error('[api/posts] GET', error)
    return NextResponse.json({ error: 'Не удалось загрузить посты' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await ensureDb()
    const body = await request.json()
    const title = (body.title ?? '').trim()
    const content = (body.content ?? '').trim()
    const hashtags = normalizeHashtags(body.hashtags ?? '')
    const status = body.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED'
    const speakerId = typeof body.speakerId === 'string' && body.speakerId ? body.speakerId : null

    if (!title) {
      return NextResponse.json({ error: 'Заголовок обязателен' }, { status: 400 })
    }
    if (!content) {
      return NextResponse.json({ error: 'Текст поста обязателен' }, { status: 400 })
    }
    if (status === 'PUBLISHED' && !speakerId) {
      return NextResponse.json({ error: 'Выберите автора поста' }, { status: 400 })
    }

    const post = await db.post.create({
      data: { title, content, hashtags, status, speakerId },
      include: { speaker: true },
    })
    return NextResponse.json(post, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Не удалось сохранить пост' }, { status: 500 })
  }
}

function normalizeHashtags(raw: string): string {
  return raw
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith('#') ? t : `#${t}`))
    .join(' ')
}