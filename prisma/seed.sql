-- Начальные данные: спикеры по умолчанию (PostgreSQL).
-- Обычно запускается автоматически при деплое через `node scripts/seed.mjs`.
-- Этот файл — запасной вариант для ручного запуска:
--   psql "$DATABASE_URL" -f prisma/seed.sql

INSERT INTO "Speaker" ("id", "name", "createdAt") VALUES
  ('spk-ivanova-vlada',    'Иванова Влада',    CURRENT_TIMESTAMP),
  ('spk-nefedova-ksenia',  'Нефедова Ксения',  CURRENT_TIMESTAMP),
  ('spk-nikolova-aliya',   'Николова Алия',    CURRENT_TIMESTAMP),
  ('spk-hakimova-natalya', 'Хакимова Наталья', CURRENT_TIMESTAMP),
  ('spk-verenikina-zhenya','Вереникина Женя',  CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;
