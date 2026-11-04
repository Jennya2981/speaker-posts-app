-- Начальные данные: спикеры по умолчанию.
-- Запуск: npm run db:seed
-- INSERT OR IGNORE не создаёт дубликаты — скрипт можно запускать повторно.

INSERT OR IGNORE INTO Speaker (id, name, createdAt) VALUES ('spk-ivanova-vlada', 'Иванова Влада', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO Speaker (id, name, createdAt) VALUES ('spk-nefedova-ksenia', 'Нефедова Ксения', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO Speaker (id, name, createdAt) VALUES ('spk-nikolova-aliya', 'Николова Алия', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO Speaker (id, name, createdAt) VALUES ('spk-hakimova-natalya', 'Хакимова Наталья', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO Speaker (id, name, createdAt) VALUES ('spk-venenikina-zhenya', 'Вереникина Женя', CURRENT_TIMESTAMP);