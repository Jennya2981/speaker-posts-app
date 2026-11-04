import { db } from '@/lib/db'

// Гарантирует, что таблицы и стартовые спикеры есть в базе.
// Работает независимо от того, отработал ли `prisma db push` при сборке:
// на «холодной» базе создаёт схему сама. Все операции идемпотентны.
//
// Важно: инициализация никогда не «валит» запрос. Если DDL не удался
// (например, таблицы уже есть и параллельный запрос держит блокировку),
// работа продолжается — чтение/запись выполнит обычный запрос Prisma.

const DEFAULT_SPEAKERS = [
  'Иванова Влада',
  'Нефедова Ксения',
  'Николова Алия',
  'Хакимова Наталья',
  'Вереникина Женя',
]

const DDL = [
  `CREATE TABLE IF NOT EXISTS "Speaker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Speaker_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Speaker_name_key" ON "Speaker"("name")`,
  `CREATE TABLE IF NOT EXISTS "Post" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "hashtags" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "speakerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "Post_speakerId_idx" ON "Post"("speakerId")`,
  `CREATE INDEX IF NOT EXISTS "Post_createdAt_idx" ON "Post"("createdAt")`,
]

function speakerId(name: string): string {
  return 'spk-' + Buffer.from(name, 'utf8').toString('hex').slice(0, 24)
}

async function setup() {
  for (const statement of DDL) {
    try {
      await db.$executeRawUnsafe(statement)
    } catch (error) {
      console.warn('[ensure-db] DDL пропущен:', error instanceof Error ? error.message : error)
    }
  }

  for (const name of DEFAULT_SPEAKERS) {
    try {
      await db.$executeRawUnsafe(
        'INSERT INTO "Speaker" ("id", "name", "createdAt") VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT ("name") DO NOTHING',
        speakerId(name),
        name,
      )
    } catch (error) {
      console.warn('[ensure-db] Спикер не добавлен:', name, error instanceof Error ? error.message : error)
    }
  }

  // Финальная проверка, что база действительно отвечает.
  // Если нет — сбрасываем кэш готовности, чтобы следующий запрос повторил попытку.
  await db.speaker.count()
}

let ready: Promise<void> | null = null

export function ensureDb(): Promise<void> {
  if (!ready) {
    ready = setup().catch((error) => {
      ready = null
      throw error
    })
  }
  return ready
}
