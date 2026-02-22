const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Регистрация нового пользователя
router.post(
    '/register',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 6 }).withMessage('Пароль должен быть не менее 6 символов'),
        body('name').trim().notEmpty().withMessage('Имя не может быть пустым')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { email, password, name } = req.body;

            // Проверяем, существует ли уже пользователь
            const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            if (existingUser.rows.length > 0) {
                return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
            }

            // Хешируем пароль
            const hashedPassword = await bcrypt.hash(password, 10);

            // Создаем нового пользователя
            const result = await pool.query(
                'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
                [email, hashedPassword, name]
            );

            const user = result.rows[0];

            // Создаем JWT токен
            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            res.status(201).json({ message: 'Пользователь успешно зарегистрирован', user, token });
        } catch (err) {
            console.error('Ошибка при регистрации:', err);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }
);

// Вход в систему
router.post(
    '/login',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { email, password } = req.body;

            // Находим пользователя
            const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            if (result.rows.length === 0) {
                return res.status(401).json({ message: 'Неверный email или пароль' });
            }

            const user = result.rows[0];

            // Проверяем пароль
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Неверный email или пароль' });
            }

            // Создаем JWT токен
            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            res.json({ message: 'Успешный вход', user: { id: user.id, email: user.email, name: user.name }, token });
        } catch (err) {
            console.error('Ошибка при входе:', err);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }
);

// Получение текущего пользователя
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, name FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при получении пользователя:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Выход из системы
router.post('/logout', authMiddleware, (req, res) => {
    res.json({ message: 'Успешный выход из системы' });
});

module.exports = router;
