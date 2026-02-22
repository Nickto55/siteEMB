const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Все роуты требуют аутентификации
router.use(authenticateToken);

// GET /api/reports - Получить список отчетов
router.get('/', async (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        let query = `
      SELECT r.*, u.username as author_username
      FROM reports r
      JOIN users u ON r.user_id = u.id
    `;
        const params = [];

        // Фильтр по статусу
        if (status) {
            params.push(status);
            query += ` WHERE r.status = $${params.length}`;
        }

        query += ' ORDER BY r.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
        params.push(limit, offset);

        const result = await pool.query(query, params);

        res.json({
            reports: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Ошибка при получении отчетов:', error);
        res.status(500).json({ error: 'Ошибка сервера при получении отчетов' });
    }
});

// GET /api/reports/:id - Получить отчет по ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT r.*, u.username as author_username
       FROM reports r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Отчет не найден' });
        }

        res.json({ report: result.rows[0] });
    } catch (error) {
        console.error('Ошибка при получении отчета:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// POST /api/reports - Создать новый отчет
router.post('/', async (req, res) => {
    try {
        const { title, description, server_name } = req.body;

        // Валидация входных данных
        if (!title || !description) {
            return res.status(400).json({ error: 'Название и описание обязательны' });
        }

        if (title.length < 5) {
            return res.status(400).json({ error: 'Название должно быть минимум 5 символов' });
        }

        if (description.length < 10) {
            return res.status(400).json({ error: 'Описание должно быть минимум 10 символов' });
        }

        // Создание отчета
        const result = await pool.query(
            `INSERT INTO reports (user_id, title, description, server_name, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
            [req.user.id, title, description, server_name || null]
        );

        res.status(201).json({
            message: 'Отчет успешно создан',
            report: result.rows[0]
        });
    } catch (error) {
        console.error('Ошибка при создании отчета:', error);
        res.status(500).json({ error: 'Ошибка сервера при создании отчета' });
    }
});

// PUT /api/reports/:id - Обновить отчет
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, server_name, status } = req.body;

        // Проверка существования отчета
        const reportCheck = await pool.query('SELECT * FROM reports WHERE id = $1', [id]);
        if (reportCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Отчет не найден' });
        }

        const report = reportCheck.rows[0];

        // Обычные пользователи могут редактировать только свои отчеты
        if (req.user.role !== 'admin' && report.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Нет прав на редактирование этого отчета' });
        }

        // Только админы могут менять статус
        if (status && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Только администратор может изменять статус отчета' });
        }

        // Валидация статуса
        if (status && !['pending', 'in_progress', 'resolved', 'closed'].includes(status)) {
            return res.status(400).json({ error: 'Недопустимый статус' });
        }

        // Обновление отчета
        const updateFields = [];
        const params = [];
        let paramCount = 1;

        if (title !== undefined) {
            updateFields.push(`title = $${paramCount}`);
            params.push(title);
            paramCount++;
        }
        if (description !== undefined) {
            updateFields.push(`description = $${paramCount}`);
            params.push(description);
            paramCount++;
        }
        if (server_name !== undefined) {
            updateFields.push(`server_name = $${paramCount}`);
            params.push(server_name);
            paramCount++;
        }
        if (status !== undefined && req.user.role === 'admin') {
            updateFields.push(`status = $${paramCount}`);
            params.push(status);
            paramCount++;
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'Нет данных для обновления' });
        }

        params.push(id);
        const query = `UPDATE reports SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

        const result = await pool.query(query, params);

        res.json({
            message: 'Отчет успешно обновлен',
            report: result.rows[0]
        });
    } catch (error) {
        console.error('Ошибка при обновлении отчета:', error);
        res.status(500).json({ error: 'Ошибка сервера при обновлении отчета' });
    }
});

// DELETE /api/reports/:id - Удалить отчет
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Проверка существования отчета
        const reportCheck = await pool.query('SELECT * FROM reports WHERE id = $1', [id]);
        if (reportCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Отчет не найден' });
        }

        const report = reportCheck.rows[0];

        // Обычные пользователи могут удалять только свои отчеты
        if (req.user.role !== 'admin' && report.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Нет прав на удаление этого отчета' });
        }

        // Удаление отчета
        await pool.query('DELETE FROM reports WHERE id = $1', [id]);

        res.json({ message: 'Отчет успешно удален' });
    } catch (error) {
        console.error('Ошибка при удалении отчета:', error);
        res.status(500).json({ error: 'Ошибка сервера при удалении отчета' });
    }
});

module.exports = router;
