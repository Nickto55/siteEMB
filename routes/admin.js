const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Все роуты требуют аутентификации и прав администратора
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/users - Получить список всех пользователей
router.get('/users', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
        );

        res.json({
            users: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Ошибка при получении пользователей:', error);
        res.status(500).json({ error: 'Ошибка сервера при получении пользователей' });
    }
});

// GET /api/admin/users/:id - Получить информацию о пользователе
router.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Ошибка при получении пользователя:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// PUT /api/admin/users/:id/role - Изменить роль пользователя
router.put('/users/:id/role', async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        // Валидация роли
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Недопустимая роль. Допустимые значения: user, admin' });
        }

        // Проверка существования пользователя
        const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        // Обновление роли
        const result = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, role',
            [role, id]
        );

        res.json({
            message: 'Роль пользователя успешно обновлена',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Ошибка при обновлении роли:', error);
        res.status(500).json({ error: 'Ошибка сервера при обновлении роли' });
    }
});

// DELETE /api/admin/users/:id - Удалить пользователя
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Запрет на удаление самого себя
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'Нельзя удалить свою собственную учетную запись' });
        }

        // Проверка существования пользователя
        const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        // Удаление пользователя
        await pool.query('DELETE FROM users WHERE id = $1', [id]);

        res.json({ message: 'Пользователь успешно удален' });
    } catch (error) {
        console.error('Ошибка при удалении пользователя:', error);
        res.status(500).json({ error: 'Ошибка сервера при удалении пользователя' });
    }
});

module.exports = router;
