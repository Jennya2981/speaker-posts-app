-- Начальные данные: спикеры по умолчанию.
-- Запуск: npm run db:seed
-- INSERT OR IGNORE не создаёт дубликаты — скрипт можно запускать повторно.

INSERT OR IGNORE INTO Speaker (id, name, createdAt) VALUES ('spk-anna-sokolova', 'Анна Соколова', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO Speaker (id, name, createdAt) VALUES ('spk-dmitry-kim', 'Дмитрий Ким', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO Speaker (id, name, createdAt) VALUES ('spk-maria-petrenko', 'Мария Петренко', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO Speaker (id, name, createdAt) VALUES ('spk-igor-volkov', 'Игорь Волков', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO Speaker (id, name, createdAt) VALUES ('spk-elena-morozova', 'Елена Морозова', CURRENT_TIMESTAMP);