// Добавляет 5 спикеров по умолчанию. Скрипт идемпотентный — можно запускать повторно.
// Запуск: node scripts/seed.mjs  (или npm run db:seed)

import { PrismaClient } from '@prisma/client'

const SPEAKERS = [
  'Иванова Влада',
  'Нефедова Ксения',
  'Николова Алия',
  'Хакимова Наталья',
  'Вереникина Женя',
]

const db = new PrismaClient()

try {
  for (const name of SPEAKERS) {
    await db.speaker.upsert({
      where: { name },
      update: {},
      create: { name },
    })
    console.log(`[seed] ${name} — ок`)
  }
  console.log('[seed] Готово.')
} catch (error) {
  console.error('[seed] Ошибка:', error?.message ?? error)
  process.exitCode = 1
} finally {
  await db.$disconnect()
}
