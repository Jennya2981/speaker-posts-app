// Создание таблиц и заполнение базы при деплое.
// Запускается из `npm run build` (см. package.json) и вручную: node scripts/setup-db.mjs
//
// Если DATABASE_URL не задан или это не PostgreSQL (например, локально),
// скрипт просто пропускает шаг, чтобы сборка не падала.

import { execSync } from 'node:child_process'

const url = process.env.DATABASE_URL ?? ''

if (!url.startsWith('postgres://') && !url.startsWith('postgresql://')) {
  console.log('[setup-db] DATABASE_URL не PostgreSQL — пропускаю создание таблиц.')
  process.exit(0)
}

try {
  console.log('[setup-db] Применяю схему Prisma к базе…')
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    stdio: 'inherit',
    env: process.env,
  })
  console.log('[setup-db] Схема применена.')
} catch (error) {
  // Не валим сборку: приложение само создаст таблицы при первом запросе
  // (см. src/lib/ensure-db.ts).
  console.warn('[setup-db] Не удалось применить схему:', error?.message ?? error)
}

try {
  console.log('[setup-db] Заполняю списками по умолчанию…')
  execSync('node scripts/seed.mjs', { stdio: 'inherit', env: process.env })
} catch (error) {
  console.warn('[setup-db] Не удалось заполнить базу:', error?.message ?? error)
}
