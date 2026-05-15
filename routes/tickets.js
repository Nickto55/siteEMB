const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { Logger } = require('../utils/logger');
const logger = new Logger('Tickets');

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
        logger.error('Ошибка при создании тикета', { error: error.message });
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
        logger.error('Ошибка при получении тикетов', { error: error.message });
        res.status(500).json({ error: 'Ошибка сервера при получении тикетов' });
    }
});

// GET /api/tickets/public/:id - Публичный просмотр тикета по ID + email
router.get('/public/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({ error: 'Email обязателен для просмотра тикета' });
        }

        const result = await pool.query(
            `SELECT id, username, email, category, subject, description, status, priority,
                    admin_response, responded_at, created_at, resolved_at
             FROM tickets WHERE id = $1 AND (email = $2 OR email IS NULL)`,
            [id, email]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Тикет не найден или email не совпадает' });
        }

        res.json({ ticket: result.rows[0] });
    } catch (error) {
        logger.error('Ошибка при публичном получении тикета', { error: error.message });
        res.status(500).json({ error: 'Ошибка сервера' });
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
        logger.error('Ошибка при получении тикета', { error: error.message });
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// PUT /api/tickets/:id/response - Ответить на тикет (только для администраторов)
router.put('/:id/response', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { response } = req.body;

        if (!response || response.trim().length < 2) {
            return res.status(400).json({ error: 'Ответ должен быть минимум 2 символа' });
        }

        const ticketCheck = await pool.query('SELECT id FROM tickets WHERE id = $1', [id]);
        if (ticketCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Тикет не найден' });
        }

        const result = await pool.query(
            `UPDATE tickets SET admin_response = $1, responded_at = CURRENT_TIMESTAMP, assigned_to = $2, status = 'resolved' WHERE id = $3 RETURNING *`,
            [response.trim(), req.user.id, id]
        );

        res.json({
            message: 'Ответ успешно отправлен',
            ticket: result.rows[0]
        });
    } catch (error) {
        logger.error('Ошибка при ответе на тикет', { error: error.message });
        res.status(500).json({ error: 'Ошибка сервера при отправке ответа' });
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
        logger.error('Ошибка при обновлении статуса тикета', { error: error.message });
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
        logger.error('Ошибка при обновлении приоритета', { error: error.message });
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
        logger.error('Ошибка при удалении тикета', { error: error.message });
        res.status(500).json({ error: 'Ошибка сервера при удалении тикета' });
    }
});

module.exports = router;
