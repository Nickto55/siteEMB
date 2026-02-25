const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/content/:pageName - Получить контент страницы (публичный доступ)
router.get('/:pageName', async (req, res) => {
    try {
        const { pageName } = req.params;

        const result = await pool.query(
            'SELECT id, page_name, title, content, version FROM page_content WHERE page_name = $1 AND is_active = true',
            [pageName]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Контент страницы не найден' });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Ошибка при получении контента:', error);
        res.status(500).json({ error: 'Ошибка сервера при получении контента' });
    }
});

// GET /api/content/:pageName/history - Получить историю версий (только админ)
router.get('/:pageName/history', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { pageName } = req.params;

        // Получить ID страницы
        const pageResult = await pool.query(
            'SELECT id FROM page_content WHERE page_name = $1',
            [pageName]
        );

        if (pageResult.rows.length === 0) {
            return res.status(404).json({ error: 'Страница не найдена' });
        }

        const pageId = pageResult.rows[0].id;

        // Получить историю
        const result = await pool.query(
            `SELECT h.id, h.version, h.created_at, u.username as created_by
             FROM page_content_history h
             LEFT JOIN users u ON h.created_by = u.id
             WHERE h.page_id = $1
             ORDER BY h.version DESC`,
            [pageId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Ошибка при получении истории:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// PUT /api/content/:pageName - Обновить контент страницы (только админ)
router.put('/:pageName', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { pageName } = req.params;
        const { title, content } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Контент обязателен' });
        }

        // Получить текущую версию
        const pageResult = await pool.query(
            'SELECT id, version FROM page_content WHERE page_name = $1',
            [pageName]
        );

        if (pageResult.rows.length === 0) {
            return res.status(404).json({ error: 'Страница не найдена' });
        }

        const pageId = pageResult.rows[0].id;
        const currentVersion = pageResult.rows[0].version;
        const newVersion = currentVersion + 1;

        // Начать транзакцию
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Сохранить текущий контент в историю перед обновлением
            await client.query(
                `INSERT INTO page_content_history (page_id, content_text, version, created_by)
                 VALUES ($1, (SELECT content FROM page_content WHERE id = $2), $3, $4)`,
                [pageId, pageId, currentVersion, req.user.id]
            );

            // Обновить контент
            const updateResult = await client.query(
                `UPDATE page_content 
                 SET content = $1, title = $2, version = $3, updated_by = $4
                 WHERE id = $5
                 RETURNING id, page_name, title, content, version, updated_at`,
                [content, title || null, newVersion, req.user.id, pageId]
            );

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Контент успешно обновлен',
                data: updateResult.rows[0]
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Ошибка при обновлении контента:', error);
        res.status(500).json({ error: 'Ошибка сервера при обновлении контента' });
    }
});

// POST /api/content/page - Создать новую страницу (только админ)
router.post('/page', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { pageName, title, content } = req.body;

        if (!pageName || !content) {
            return res.status(400).json({ error: 'Название страницы и контент обязательны' });
        }

        const result = await pool.query(
            `INSERT INTO page_content (page_name, title, content, updated_by)
             VALUES ($1, $2, $3, $4)
             RETURNING id, page_name, title, content, version`,
            [pageName, title || null, content, req.user.id]
        );

        res.status(201).json({
            success: true,
            message: 'Страница успешно создана',
            data: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') { // Unique constraint violation
            return res.status(400).json({ error: 'Страница с таким названием уже существует' });
        }
        console.error('Ошибка при создании страницы:', error);
        res.status(500).json({ error: 'Ошибка сервера при создании страницы' });
    }
});

// DELETE /api/content/:pageName - Удалить страницу (только админ)
router.delete('/:pageName', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { pageName } = req.params;

        const result = await pool.query(
            'DELETE FROM page_content WHERE page_name = $1 RETURNING id',
            [pageName]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Страница не найдена' });
        }

        res.json({
            success: true,
            message: 'Страница успешно удалена'
        });
    } catch (error) {
        console.error('Ошибка при удалении страницы:', error);
        res.status(500).json({ error: 'Ошибка сервера при удалении страницы' });
    }
});

// GET /api/content/admin/all - Получить все страницы (только админ)
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, page_name, title, is_active, version, updated_at FROM page_content ORDER BY page_name'
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Ошибка при получении страниц:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;
