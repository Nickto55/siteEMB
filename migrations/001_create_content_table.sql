-- Таблица для хранения содержимого страниц
CREATE TABLE IF NOT EXISTS page_content (
    id SERIAL PRIMARY KEY,
    page_name VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500),
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    version INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INT REFERENCES users(id) ON DELETE SET NULL
);

-- Индекс для быстрого поиска по page_name
CREATE INDEX idx_page_content_name ON page_content(page_name);

-- Таблица истории версий контента
CREATE TABLE IF NOT EXISTS page_content_history (
    id SERIAL PRIMARY KEY,
    page_id INT NOT NULL REFERENCES page_content(id) ON DELETE CASCADE,
    content_text TEXT NOT NULL,
    version INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT REFERENCES users(id) ON DELETE SET NULL
);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для обновления updated_at
DROP TRIGGER IF EXISTS update_page_content_updated_at on page_content;
CREATE TRIGGER update_page_content_updated_at BEFORE UPDATE
    ON page_content FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
