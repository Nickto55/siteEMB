# Website - Express.js REST API

Простой Express.js сервер с REST API для управления пользователями, отчетами и административными функциями.

## Требования

- Node.js 18+
- npm 8+
- PostgreSQL 15+

## Установка

1. Клонируйте репозиторий и перейдите в папку проекта:

```bash
cd website
```

2. Установите зависимости:

```bash
npm install
```

3. Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

4. Отредактируйте файл `.env` и установите корректные значения для вашего окружения.

5. Инициализируйте базу данных PostgreSQL:

```bash
psql -U postgres -d postgres -f database/init.sql
```

## Запуск

### Для разработки (с nodemon):

```bash
npm run dev
```

### Для производства:

```bash
npm start
```

Сервер будет доступен по адресу `http://localhost:3000`

## API Эндпоинты

### Аутентификация

- `POST /api/auth/register` - Регистрация нового пользователя
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/logout` - Выход из системы
- `GET /api/auth/me` - Получение информации текущего пользователя

### Отчеты

- `GET /api/reports` - Получить все отчеты
- `GET /api/reports/:id` - Получить отчет по ID
- `POST /api/reports` - Создать новый отчет
- `PUT /api/reports/:id` - Обновить отчет
- `DELETE /api/reports/:id` - Удалить отчет

### Администрирование

- `GET /api/admin/users` - Получить всех пользователей (только для администраторов)
- `GET /api/admin/stats` - Получить статистику (только для администраторов)
- `DELETE /api/admin/users/:id` - Удалить пользователя (только для администраторов)

## Примеры использования

### Регистрация пользователя

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword",
    "name": "Иван Петров"
  }'
```

### Вход в систему

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword"
  }'
```

### Получить информацию текущего пользователя

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Создать отчет

```bash
curl -X POST http://localhost:3000/api/reports \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Квартальный отчет",
    "description": "Описание отчета за первый квартал"
  }'
```

## Структура проекта

```
website/
├── server.js               # Главный файл сервера
├── db.js                  # Конфигурация подключения к БД
├── package.json           # Зависимости проекта
├── .env.example          # Пример переменных окружения
├── middleware/
│   └── auth.js           # Middleware для аутентификации
├── routes/
│   ├── auth.js           # Маршруты аутентификации
│   ├── reports.js        # Маршруты отчетов
│   └── admin.js          # Административные маршруты
└── database/
    └── init.sql          # Инициализационный скрипт БД
```

## Переменные окружения

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/serverreport
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

## Безопасность

- Пароли хешируются с использованием bcryptjs
- JWT токены используются для аутентификации
- Helmet.js используется для установки различных HTTP заголовков
- CORS правильно настроена
- Валидация входных данных с помощью express-validator

## Лицензия

MIT
