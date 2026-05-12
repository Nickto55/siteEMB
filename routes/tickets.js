const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// POST /api/tickets - Создать новый тикет (доступно всем, без авторизации)
router.post('/', async (req, res) => {
    try {
        const { username, email, category, subject, description } = req.body;

        // Валидация
        if (!username || !category || !subject || !description) {
            return res.status(400).json({ error: 'Никнейм, категория, тема и описание обязательны' });
        }

        if (username.length < 2 || username.length > 50) {
            return res.status(400).json({ error: 'Никнейм должен быть от 2 до 50 символов' });
        }

        if (subject.length < 3 || subject.length > 255) {
            return res.status(400).json({ error: 'Тема должна быть от 3 до 255 символов' });
        }

        if (description.length < 10) {
            return res.status(400).json({ error: 'Описание должно быть минимум 10 символов' });
        }

        const result = await pool.query(
            `INSERT INTO tickets (username, email, category, subject, description, status, priority)
             VALUES ($1, $2, $3, $4, $5, 'open', 'normal')
             RETURNING *`,
            [username, email || null, category, subject, description]
        );

        res.status(201).json({
            message: 'Тикет успешно создан',
            ticket: result.rows[0]
        });
    } catch (error) {
        console.error('Ошибка при создании тикета:', error);
        res.status(500).json({ error: 'Ошибка сервера при создании тикета' });
    }
});

// GET /api/tickets - Получить все тикеты (только для администраторов)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { status, priority, search } = req.query;
        let query = 'SELECT t.*, u.username as assigned_username FROM tickets t LEFT JOIN users u ON t.assigned_to = u.id WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (status) {
            query += ` AND t.status = $${paramIndex++}`;
            params.push(status);
        }

        if (priority) {
            query += ` AND t.priority = $${paramIndex++}`;
            params.push(priority);
        }

        if (search) {
            query += ` AND (t.username ILIKE $${paramIndex} OR t.subject ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += ' ORDER BY t.created_at DESC';

        const result = await pool.query(query, params);

        res.json({
            tickets: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Ошибка при получении тикетов:', error);
        res.status(500).json({ error: 'Ошибка сервера при получении тикетов' });
    }
});

// GET /api/tickets/:id - Получить тикет по ID (только для администраторов)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT t.*, u.username as assigned_username 
             FROM tickets t 
             LEFT JOIN users u ON t.assigned_to = u.id 
             WHERE t.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Тикет не найден' });
        }

        res.json({ ticket: result.rows[0] });
    } catch (error) {
        console.error('Ошибка при получении тикета:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// PUT /api/tickets/:id/status - Изменить статус тикета (только для администраторов)
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
            return res.status(400).json({ error: 'Недопустимый статус. Допустимые: open, in_progress, resolved, closed' });
        }

        const ticketCheck = await pool.query('SELECT id FROM tickets WHERE id = $1', [id]);
        if (ticketCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Тикет не найден' });
        }

        const updates = ['status = $1'];
        const values = [status];
        let paramIndex = 2;

        if (status === 'resolved') {
            updates.push(`resolved_at = CURRENT_TIMESTAMP`);
        }

        updates.push(`assigned_to = $${paramIndex}`);
        values.push(req.user.id);
        paramIndex++;

        values.push(id);

        const result = await pool.query(
            `UPDATE tickets SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );

        res.json({
            message: 'Статус тикета успешно обновлен',
            ticket: result.rows[0]
        });
    } catch (error) {
        console.error('Ошибка при обновлении статуса тикета:', error);
        res.status(500).json({ error: 'Ошибка сервера при обновлении статуса' });
    }
});

// PUT /api/tickets/:id/priority - Изменить приоритет тикета (только для администраторов)
router.put('/:id/priority', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { priority } = req.body;

        if (!['low', 'normal', 'high', 'urgent'].includes(priority)) {
            return res.status(400).json({ error: 'Недопустимый приоритет. Допустимые: low, normal, high, urgent' });
        }

        const ticketCheck = await pool.query('SELECT id FROM tickets WHERE id = $1', [id]);
        if (ticketCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Тикет не найден' });
        }

        const result = await pool.query(
            'UPDATE tickets SET priority = $1 WHERE id = $2 RETURNING *',
            [priority, id]
        );

        res.json({
            message: 'Приоритет тикета успешно обновлен',
            ticket: result.rows[0]
        });
    } catch (error) {
        console.error('Ошибка при обновлении приоритета:', error);
        res.status(500).json({ error: 'Ошибка сервера при обновлении приоритета' });
    }
});

// DELETE /api/tickets/:id - Удалить тикет (только для администраторов)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const ticketCheck = await pool.query('SELECT id FROM tickets WHERE id = $1', [id]);
        if (ticketCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Тикет не найден' });
        }

        await pool.query('DELETE FROM tickets WHERE id = $1', [id]);

        res.json({ message: 'Тикет успешно удален' });
    } catch (error) {
        console.error('Ошибка при удалении тикета:', error);
        res.status(500).json({ error: 'Ошибка сервера при удалении тикета' });
    }
});

module.exports = router;
