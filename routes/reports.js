const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Получить все отчеты (только защищенный доступ)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT r.id, r.title, r.description, r.created_at, r.user_id, u.name FROM reports r JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка при получении отчетов:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получить отчет по ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT r.id, r.title, r.description, r.created_at, r.user_id, u.name FROM reports r JOIN users u ON r.user_id = u.id WHERE r.id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Отчет не найден' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при получении отчета:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Создать новый отчет
router.post(
    '/',
    authMiddleware,
    [
        body('title').trim().notEmpty().withMessage('Название отчета не может быть пустым'),
        body('description').trim().notEmpty().withMessage('Описание не может быть пустым')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { title, description } = req.body;
            const userId = req.user.id;

            const result = await pool.query(
                'INSERT INTO reports (title, description, user_id) VALUES ($1, $2, $3) RETURNING id, title, description, created_at, user_id',
                [title, description, userId]
            );

            res.status(201).json({ message: 'Отчет успешно создан', report: result.rows[0] });
        } catch (err) {
            console.error('Ошибка при создании отчета:', err);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }
);

// Обновить отчет
router.put(
    '/:id',
    authMiddleware,
    [
        body('title').trim().notEmpty().withMessage('Название отчета не может быть пустым'),
        body('description').trim().notEmpty().withMessage('Описание не может быть пустым')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { id } = req.params;
            const { title, description } = req.body;
            const userId = req.user.id;

            // Проверяем, что пользователь является автором отчета
            const reportCheck = await pool.query('SELECT user_id FROM reports WHERE id = $1', [id]);
            if (reportCheck.rows.length === 0) {
                return res.status(404).json({ message: 'Отчет не найден' });
            }

            if (reportCheck.rows[0].user_id !== userId) {
                return res.status(403).json({ message: 'У вас нет прав на редактирование этого отчета' });
            }

            const result = await pool.query(
                'UPDATE reports SET title = $1, description = $2 WHERE id = $3 RETURNING id, title, description, created_at, user_id',
                [title, description, id]
            );

            res.json({ message: 'Отчет успешно обновлен', report: result.rows[0] });
        } catch (err) {
            console.error('Ошибка при обновлении отчета:', err);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }
);

// Удалить отчет
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Проверяем, что пользователь является автором отчета
        const reportCheck = await pool.query('SELECT user_id FROM reports WHERE id = $1', [id]);
        if (reportCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Отчет не найден' });
        }

        if (reportCheck.rows[0].user_id !== userId) {
            return res.status(403).json({ message: 'У вас нет прав на удаление этого отчета' });
        }

        await pool.query('DELETE FROM reports WHERE id = $1', [id]);
        res.json({ message: 'Отчет успешно удален' });
    } catch (err) {
        console.error('Ошибка при удалении отчета:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;
