import { db } from '@/lib/db'

// Гарантирует, что таблицы и стартовые спикеры есть в базе.
// Работает независимо от того, отработал ли `prisma db push` при сборке:
// на «холодной» базе создаёт схему сама. Все операции идемпотентны.

const DEFAULT_SPEAKERS = [
  'Иванова Влада',
  'Нефедова Ксения',
  'Николова Алия',
  'Хакимова Наталья',
  'Вереникина Женя',
]

const DDL = `
CREATE TABLE IF NOT EXISTS "Speaker" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Speaker_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Speaker_name_key" ON "Speaker"("name");

CREATE TABLE IF NOT EXISTS "Post" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "hashtags" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
  "speakerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Post_speakerId_idx" ON "Post"("speakerId");
CREATE INDEX IF NOT EXISTS "Post_createdAt_idx" ON "Post"("createdAt");
`

let ready: Promise<void> | null = null

async function setup() {
  // Несколько отдельных запросов: Prisma не выполняет пачку DDL за раз.
  for (const statement of DDL.split(';').map((s) => s.trim()).filter(Boolean)) {
    await db.$executeRawUnsafe(statement)
  }

  for (const name of DEFAULT_SPEAKERS) {
    await db.$executeRawUnsafe(
      'INSERT INTO "Speaker" ("id", "name", "createdAt") VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT ("name") DO NOTHING',
      `spk-${Buffer.from(name).toString('hex').slice(0, 24)}`,
      name,
    )
  }
}

export function ensureDb(): Promise<void> {
  if (!ready) {
    ready = setup().catch((error) => {
      // Сбрасываем кэш, чтобы следующая попытка повторила инициализацию.
      ready = null
      throw error
    })
  }
  return ready
}
