const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Middleware для проверки администратора
const isAdmin = async (req, res, next) => {
    try {
        const result = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0 || !result.rows[0].is_admin) {
            return res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора' });
        }
        next();
    } catch (err) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

// Получить всех пользователей (только для админов)
router.get('/users', authMiddleware, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, name, is_admin, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка при получении пользователей:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получить статистику (только для админов)
router.get('/stats', authMiddleware, isAdmin, async (req, res) => {
    try {
        const usersCount = await pool.query('SELECT COUNT(*) FROM users');
        const reportsCount = await pool.query('SELECT COUNT(*) FROM reports');
        const commentsCount = await pool.query('SELECT COUNT(*) FROM comments');

        res.json({
            totalUsers: parseInt(usersCount.rows[0].count),
            totalReports: parseInt(reportsCount.rows[0].count),
            totalComments: parseInt(commentsCount.rows[0].count)
        });
    } catch (err) {
        console.error('Ошибка при получении статистики:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Удалить пользователя (только для админов)
router.delete('/users/:id', authMiddleware, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Не разрешаем удалять себя
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ message: 'Вы не можете удалить свой аккаунт через панель администратора' });
        }

        const result = await pool.query('SELECT email FROM users WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: `Пользователь ${result.rows[0].email} успешно удален` });
    } catch (err) {
        console.error('Ошибка при удалении пользователя:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;
