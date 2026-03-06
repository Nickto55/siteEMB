const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// Валидация email
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// POST /api/auth/register - Регистрация нового пользователя
router.post('/register', async (req, res) => {
    try {
        console.log('📝 Попытка регистрации:', req.body);

        const { username, email, password } = req.body;

        // Валидация входных данных
        if (!username || !email || !password) {
            console.log('❌ Отсутствуют обязательные поля');
            return res.status(400).json({ error: 'Все поля обязательны' });
        }

        if (username.length < 3) {
            console.log('❌ Имя пользователя слишком короткое');
            return res.status(400).json({ error: 'Имя пользователя должно быть минимум 3 символа' });
        }

        if (!isValidEmail(email)) {
            console.log('❌ Некорректный email:', email);
            return res.status(400).json({ error: 'Некорректный email' });
        }

        if (password.length < 6) {
            console.log('❌ Пароль слишком короткий');
            return res.status(400).json({ error: 'Пароль должен быть минимум 6 символов' });
        }

        console.log('🔍 Проверка существования пользователя...');

        // Проверка существования пользователя
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            console.log('❌ Пользователь уже существует');
            return res.status(409).json({ error: 'Пользователь с таким именем или email уже существует' });
        }

        console.log('🔐 Хеширование пароля...');

        // Хеширование пароля (salt rounds = 10)
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('💾 Создание пользователя...');

        // Создание пользователя (роль по умолчанию - user)
        const result = await pool.query(
            'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, created_at',
            [username, email, hashedPassword, 'user']
        );

        const user = result.rows[0];

        console.log('✅ Пользователь успешно зарегистрирован:', user.username);

        res.status(201).json({
            message: 'Пользователь успешно зарегистрирован',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error('❌ Ошибка при регистрации:', error);
        res.status(500).json({ error: 'Ошибка сервера при регистрации' });
    }
});

// POST /api/auth/login - Вход в систему
router.post('/login', async (req, res) => {
    try {
        console.log('🔑 Попытка входа:', req.body);

        const { username, password } = req.body;

        // Валидация входных данных
        if (!username || !password) {
            console.log('❌ Отсутствуют логин или пароль');
            return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
        }

        console.log('🔍 Поиск пользователя...');

        // Поиск пользователя
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            console.log('❌ Пользователь не найден');
            return res.status(401).json({ error: 'Неверные учетные данные' });
        }

        const user = result.rows[0];

        console.log('🔐 Проверка пароля...');

        // Проверка пароля
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            console.log('❌ Неверный пароль');
            return res.status(401).json({ error: 'Неверные учетные данные' });
        }

        console.log('📅 Обновление last_login...');

        // Обновление last_login
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        console.log('🎫 Генерация токена...');

        // Генерация JWT токена
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        console.log('✅ Вход выполнен успешно:', user.username);

        res.json({
            message: 'Успешный вход',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatar_url: user.avatar_url,
                bio: user.bio
            }
        });
    } catch (error) {
        console.error('❌ Ошибка при входе:', error);
        res.status(500).json({ error: 'Ошибка сервера при входе' });
    }
});

// GET /api/auth/me - Получение данных текущего пользователя
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Токен не предоставлен' });
        }

        const token = authHeader.split(' ')[1];

        // Верификация токена
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Получение данных пользователя
        const result = await pool.query(
            'SELECT id, username, email, role, avatar_url, bio, created_at, last_login FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Недействительный токен' });
        }
        console.error('Ошибка при получении данных пользователя:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// PUT /api/auth/profile - Обновление профиля пользователя
router.put('/profile', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Токен не предоставлен' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { email, avatar_url, bio } = req.body;

        // Проверка существования email (если меняется)
        if (email) {
            const existingEmail = await pool.query(
                'SELECT id FROM users WHERE email = $1 AND id != $2',
                [email, decoded.userId]
            );
            if (existingEmail.rows.length > 0) {
                return res.status(409).json({ error: 'Email уже используется другим пользователем' });
            }
        }

        // Обновление профиля
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (email !== undefined) {
            updateFields.push(`email = $${paramIndex++}`);
            updateValues.push(email);
        }
        if (avatar_url !== undefined) {
            updateFields.push(`avatar_url = $${paramIndex++}`);
            updateValues.push(avatar_url);
        }
        if (bio !== undefined) {
            updateFields.push(`bio = $${paramIndex++}`);
            updateValues.push(bio);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'Нет данных для обновления' });
        }

        updateValues.push(decoded.userId);

        const result = await pool.query(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING id, username, email, role, avatar_url, bio`,
            updateValues
        );

        res.json({
            message: 'Профиль успешно обновлен',
            user: result.rows[0]
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Недействительный токен' });
        }
        console.error('Ошибка при обновлении профиля:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// PUT /api/auth/change-password - Изменение пароля
router.put('/change-password', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Токен не предоставлен' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { currentPassword, newPassword } = req.body;

        // Валидация входных данных
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Текущий и новый пароль обязательны' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Новый пароль должен быть минимум 6 символов' });
        }

        // Получаем текущего пользователя
        const userResult = await pool.query(
            'SELECT password FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const user = userResult.rows[0];

        // Проверяем текущий пароль
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ error: 'Текущий пароль неверен' });
        }

        // Хешируем новый пароль
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Обновляем пароль
        await pool.query(
            'UPDATE users SET password = $1 WHERE id = $2',
            [hashedNewPassword, decoded.userId]
        );

        res.json({ message: 'Пароль успешно изменен' });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Недействительный токен' });
        }
        console.error('Ошибка при изменении пароля:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;
