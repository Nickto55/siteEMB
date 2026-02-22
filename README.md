# Express.js REST API - Управление пользователями и отчетами

Простое веб-приложение на Express.js с REST API для управления пользователями и отчетами, работающее с PostgreSQL.

## Технологии

- **Node.js** 18+
- **Express.js** 4.18.2
- **PostgreSQL** 15+
- **JWT** для аутентификации
- **Bcrypt** для хеширования паролей
- **Helmet** для безопасности
- **CORS** для кросс-доменных запросов

## Структура проекта

```
.
├── server.js              # Главный файл сервера
├── db.js                  # Подключение к PostgreSQL
├── package.json           # Зависимости проекта
├── .env                   # Переменные окружения
├── Dockerfile             # Docker образ
├── .dockerignore          # Исключения для Docker
├── middleware/
│   └── auth.js           # JWT аутентификация
└── routes/
    ├── auth.js           # Регистрация и вход
    ├── admin.js          # Администрирование пользователей
    └── reports.js        # Управление отчетами
```

## Установка

1. **Установите зависимости:**
```bash
npm install
```

2. **Настройте переменные окружения в файле `.env`:**
```env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/serverreport
JWT_SECRET=ваш_уникальный_секретный_ключ_минимум_32_символа
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

**Важно:** Замените `JWT_SECRET` на свой уникальный ключ. Сгенерировать можно командой:
```bash
openssl rand -hex 32
```

3. **Убедитесь, что PostgreSQL запущен и база данных создана:**
```bash
docker ps | grep postgres
```

## Запуск

### Локальный запуск

```bash
npm start
```

### Запуск в Docker

**Сборка Docker образа:**
```bash
docker build -t siteemb:latest .
```

**Запуск контейнера:**
```bash
docker run -d \
  --name website \
  -p 3000:3000 \
  --network your_network \
  -e DATABASE_URL=postgresql://postgres:postgres@postgres:5432/serverreport \
  -e JWT_SECRET=ваш_секретный_ключ \
  -e NODE_ENV=production \
  siteemb:latest
```

**Важно:** Контейнер должен быть в той же Docker сети, что и PostgreSQL.

Сервер будет доступен по адресу: `http://localhost:3000`

## API Endpoints

### Аутентификация

#### Регистрация
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "user123",
  "email": "user@example.com",
  "password": "password123"
}
```

#### Вход
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "user123",
  "password": "password123"
}
```

### Отчеты (требуется аутентификация)

#### Получить все отчеты
```http
GET /api/reports
Authorization: Bearer <token>
```

#### Получить отчет по ID
```http
GET /api/reports/:id
Authorization: Bearer <token>
```

#### Создать отчет
```http
POST /api/reports
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Название отчета",
  "description": "Подробное описание проблемы",
  "server_name": "Server #1"
}
```

#### Обновить отчет
```http
PUT /api/reports/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Новое название",
  "status": "resolved"
}
```

#### Удалить отчет
```http
DELETE /api/reports/:id
Authorization: Bearer <token>
```

### Администрирование (требуется роль admin)

#### Получить всех пользователей
```http
GET /api/admin/users
Authorization: Bearer <token>
```

#### Получить пользователя
```http
GET /api/admin/users/:id
Authorization: Bearer <token>
```

#### Изменить роль пользователя
```http
PUT /api/admin/users/:id/role
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "admin"
}
```

#### Удалить пользователя
```http
DELETE /api/admin/users/:id
Authorization: Bearer <token>
```

### Health Check

```http
GET /health
```

Проверяет состояние сервера и подключение к БД.

## Требования к базе данных

База данных должна содержать следующие таблицы:

### users
- `id` - SERIAL PRIMARY KEY
- `username` - VARCHAR UNIQUE NOT NULL
- `email` - VARCHAR UNIQUE NOT NULL
- `password` - VARCHAR NOT NULL (хешированный)
- `role` - VARCHAR NOT NULL (user/admin)
- `created_at` - TIMESTAMP DEFAULT NOW()

### reports
- `id` - SERIAL PRIMARY KEY
- `user_id` - INTEGER REFERENCES users(id)
- `title` - VARCHAR NOT NULL
- `description` - TEXT NOT NULL
- `server_name` - VARCHAR
- `status` - VARCHAR NOT NULL (pending/in_progress/resolved/closed)
- `created_at` - TIMESTAMP DEFAULT NOW()
- `updated_at` - TIMESTAMP DEFAULT NOW()

## Безопасность

✅ Helmet для защиты HTTP заголовков  
✅ CORS для контроля доступа  
✅ JWT для аутентификации  
✅ Bcrypt (10 rounds) для хеширования паролей  
✅ Валидация всех входных данных  
✅ Защита от SQL injection через параметризованные запросы  

## Роли пользователей

- **user** - обычный пользователь (может создавать и редактировать свои отчеты)
- **admin** - администратор (полный доступ ко всем функциям)

## Проверка работы

```bash
# Проверка здоровья сервера
curl http://localhost:3000/health

# Регистрация пользователя
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"test123"}'

# Вход
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'
```

## Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `PORT` | Порт сервера | 3000 |
| `NODE_ENV` | Окружение | development |
| `DATABASE_URL` | URL базы данных PostgreSQL | обязательно |
| `JWT_SECRET` | Секретный ключ для JWT | обязательно (32+ символов) |
| `JWT_EXPIRES_IN` | Время жизни токена | 7d |
| `CORS_ORIGIN` | Разрешенные источники CORS | * |

## Лицензия

ISC
