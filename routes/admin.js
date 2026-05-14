const express = require('express');
const router = express.Router();
const pool = require('../db');
const fs = require('fs');
const path = require('path');
const { Logger } = require('../utils/logger');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const logger = new Logger('AdminAPI');

// Все роуты требуют аутентификации и прав администратора
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/stats - Общая статистика
router.get('/stats', async (req, res) => {
    try {
        const usersCount = await pool.query('SELECT COUNT(*) as count FROM users');
        const ticketsCount = await pool.query('SELECT COUNT(*) as count FROM tickets');
        const reportsCount = await pool.query('SELECT COUNT(*) as count FROM reports');
        const contentCount = await pool.query('SELECT COUNT(*) as count FROM page_content');

        const ticketsByStatus = await pool.query(
            `SELECT status, COUNT(*) as count FROM tickets GROUP BY status`
        );
        const usersByRole = await pool.query(
            `SELECT role, COUNT(*) as count FROM users GROUP BY role`
        );

        const recentUsers = await pool.query(
            `SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5`
        );

        const recentTickets = await pool.query(
            `SELECT id, username, subject, status, priority, created_at FROM tickets ORDER BY created_at DESC LIMIT 5`
        );

        res.json({
            success: true,
            data: {
                counts: {
                    users: parseInt(usersCount.rows[0].count),
                    tickets: parseInt(ticketsCount.rows[0].count),
                    reports: parseInt(reportsCount.rows[0].count),
                    content: parseInt(contentCount.rows[0].count)
                },
                ticketsByStatus: ticketsByStatus.rows,
                usersByRole: usersByRole.rows,
                recentUsers: recentUsers.rows,
                recentTickets: recentTickets.rows
            }
        });
    } catch (error) {
        logger.error('Ошибка при получении статистики:', { error: error.message });
        res.status(500).json({ error: 'Ошибка сервера при получении статистики' });
    }
});

// GET /api/admin/users - Получить список всех пользователей
router.get('/users', async (req, res) => {
    try {
        const { search, role, limit = 50, offset = 0 } = req.query;
        let query = 'SELECT id, username, email, role, avatar_url, bio, created_at, last_login FROM users WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (search) {
            query += ` AND (username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (role) {
            query += ` AND role = $${paramIndex}`;
            params.push(role);
            paramIndex++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        const totalResult = await pool.query('SELECT COUNT(*) as count FROM users');

        res.json({
            users: result.rows,
            count: result.rows.length,
            total: parseInt(totalResult.rows[0].count)
        });
    } catch (error) {
        logger.error('Ошибка при получении пользователей:', { error: error.message });
        res.status(500).json({ error: 'Ошибка сервера при получении пользователей' });
    }
});

// GET /api/admin/users/:id - Получить информацию о пользователе
router.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT id, username, email, role, avatar_url, bio, created_at, last_login FROM users WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        logger.error('Ошибка при получении пользователя:', { error: error.message });
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// PUT /api/admin/users/:id/role - Изменить роль пользователя
router.put('/users/:id/role', async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['user', 'moderator', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Недопустимая роль. Допустимые значения: user, moderator, admin' });
        }

        const userCheck = await pool.query('SELECT id, username FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const result = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, role',
            [role, id]
        );

        logger.info(`Роль пользователя ${userCheck.rows[0].username} изменена на ${role}`, { adminId: req.user.id });

        res.json({
            message: 'Роль пользователя успешно обновлена',
            user: result.rows[0]
        });
    } catch (error) {
        logger.error('Ошибка при обновлении роли:', { error: error.message });
        res.status(500).json({ error: 'Ошибка сервера при обновлении роли' });
    }
});

// DELETE /api/admin/users/:id - Удалить пользователя
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'Нельзя удалить свою собственную учетную запись' });
        }

        const userCheck = await pool.query('SELECT id, username FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        await pool.query('DELETE FROM users WHERE id = $1', [id]);

        logger.info(`Пользователь ${userCheck.rows[0].username} удален`, { adminId: req.user.id });

        res.json({ message: 'Пользователь успешно удален' });
    } catch (error) {
        logger.error('Ошибка при удалении пользователя:', { error: error.message });
        res.status(500).json({ error: 'Ошибка сервера при удалении пользователя' });
    }
});

// GET /api/admin/logs - Получить логи сервера
router.get('/logs', async (req, res) => {
    try {
        const { level = 'all', lines = 100 } = req.query;
        const logsDir = path.join(__dirname, '..', 'logs');

        if (!fs.existsSync(logsDir)) {
            return res.json({ logs: [], message: 'Директория логов не найдена' });
        }

        const dateStr = new Date().toISOString().split('T')[0];
        let logFile;

        if (level !== 'all') {
            logFile = path.join(logsDir, `${dateStr}-${level}.log`);
        } else {
            logFile = path.join(logsDir, `${dateStr}-combined.log`);
        }

        if (!fs.existsSync(logFile)) {
            return res.json({ logs: [], message: 'Файл логов не найден' });
        }

        const content = fs.readFileSync(logFile, 'utf-8');
        const allLines = content.split('\n').filter(l => l.trim());
        const lastLines = allLines.slice(-parseInt(lines));

        res.json({
            logs: lastLines,
            count: lastLines.length,
            total: allLines.length,
            file: path.basename(logFile)
        });
    } catch (error) {
        logger.error('Ошибка при чтении логов:', { error: error.message });
        res.status(500).json({ error: 'Ошибка сервера при чтении логов' });
    }
});

module.exports = router;
