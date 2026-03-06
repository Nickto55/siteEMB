# EmbroMine - Веб-сайт сервера

Веб-приложение для Minecraft сервера EmbroMine с системой аутентификации, личным кабинетом и управлением контентом.

## 🚀 Возможности

- **Аутентификация пользователей**: Регистрация, вход, JWT токены
- **Личный кабинет**: Просмотр и редактирование профиля, смена пароля
- **Админ-панель**: Управление пользователями и контентом
- **Система контента**: Динамическое управление страницами сайта
- **Безопасность**: Helmet, CORS, хеширование паролей
- **Современный UI**: Tailwind CSS, responsive дизайн

## 🛠 Технологии

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT, bcrypt
- **Frontend**: HTML5, Tailwind CSS, JavaScript
- **Security**: Helmet, CORS

## 📁 Структура проекта

```
.
├── server.js              # Главный сервер
├── db.js                  # Подключение к БД
├── package.json           # Зависимости
├── .env                   # Конфигурация
├── migrations/            # Миграции БД
│   ├── 001_create_content_table.sql
│   └── 002_create_users_table.sql
├── public/                # Веб-интерфейс
│   ├── index.html        # Главная страница
│   ├── login.html        # Вход/Регистрация
│   ├── dashboard.html     # Личный кабинет
│   ├── admin-panel.html   # Админ-панель
│   ├── style.css         # Стили
│   └── script.js         # Клиентский JavaScript
├── middleware/
│   └── auth.js           # Аутентификация
├── routes/               # API маршруты
│   ├── auth.js          # Аутентификация
│   ├── admin.js         # Администрирование
│   ├── reports.js       # Отчеты
│   └── content.js       # Контент
└── scripts/
    └── initialize-content.js  # Загрузка контента
```

## ⚡ Быстрый старт

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка базы данных
Создайте базу данных PostgreSQL и выполните миграции:
```bash
# Выполните SQL файлы из папки migrations/
# 001_create_content_table.sql
# 002_create_users_table.sql
```

### 3. Настройка переменных окружения
Скопируйте `.env.example` в `.env` и настройте:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your-secret-key-here
PORT=3000
```

### 4. Запуск
```bash
npm start
```

Сервер будет доступен на http://localhost:3000

## 🔐 Аутентификация

### Регистрация и вход
- Перейдите на `/login.html`
- Зарегистрируйтесь или войдите в систему
- После входа вы будете перенаправлены в личный кабинет

### Личный кабинет (`/dashboard.html`)
- Просмотр профиля (имя, email, роль, аватар, био)
- Редактирование профиля
- Смена пароля
- Статус сервера
- Быстрые ссылки

### Админ-панель (`/admin-panel.html`)
- Доступна только для пользователей с ролью `admin`
- Управление пользователями
- Управление контентом страниц

## 📊 API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Данные текущего пользователя
- `PUT /api/auth/profile` - Обновление профиля
- `PUT /api/auth/change-password` - Смена пароля

### Администрирование
- `GET /api/admin/users` - Список пользователей
- `PUT /api/admin/users/:id/role` - Изменение роли
- `DELETE /api/admin/users/:id` - Удаление пользователя

### Контент
- `GET /api/content/:page` - Получение страницы
- `PUT /api/content/:page` - Обновление страницы
- `GET /api/content` - Список всех страниц

## 🔑 Данные администратора

По умолчанию создан администратор:
- **Логин**: admin
- **Пароль**: admin123
- **Email**: admin@embromine.ru

## 🐳 Docker

```bash
# Сборка образа
docker build -t embromine-site .

# Запуск с PostgreSQL
docker-compose up
```

## 📝 Разработка

### Добавление новых страниц
1. Создайте HTML файл в папке `public/`
2. Выполните `npm run init-content` для загрузки в БД
3. Страница станет доступна динамически

### Стилизация
Проект использует Tailwind CSS с кастомной темой EmbroMine (фиолетовые тона, темная тема).

## 🤝 Вклад в проект

1. Fork репозиторий
2. Создайте feature branch
3. Commit изменения
4. Push в branch
5. Создайте Pull Request
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

## Веб-интерфейс

После запуска откройте браузер и перейдите на `http://localhost:3000`

### Возможности веб-интерфейса:

- 🔐 **Регистрация и вход** в систему
- 📝 **Создание отчетов** с указанием названия, описания и сервера
- 📊 **Просмотр всех отчетов** пользователя
- ✏️ **Редактирование и удаление** собственных отчетов
- 👤 **Панель администратора** (только для администраторов):
  - Просмотр всех пользователей
  - Изменение ролей пользователей
  - Удаление пользователей
  - Управление статусами отчетов

### Скриншоты работы:

1. **Главная страница**: Форма входа/регистрации
2. **Рабочая панель**: Создание отчетов и просмотр списка
3. **Админ-панель**: Управление пользователями (только для администраторов)

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

## 📖 Система управления контентом страниц

Приложение включает встроенную систему для динамической загрузки и управления контентом HTML страниц из базы данных.

### Возможности:

- 📥 **Автоматическая загрузка** контента страниц из БД
- ✏️ **Редактирование контента** через веб-интерфейс 
- 📊 **История версий** - отслеживание всех изменений
- 🔒 **Защита** - только администраторы могут редактировать
- 💾 **Персистентность** - все данные сохраняются в PostgreSQL

### Быстрый старт:

```bash
# 1. Установите зависимости
npm install

# 2. Выполните миграцию БД
psql -d your_database < migrations/001_create_content_table.sql

# 3. Загрузите контент HTML файлов в БД
npm run init-content

# 4. Откройте редактор
http://localhost:3000/content-manager-demo.html
```

**Подробнее:** [Быстрый старт](./QUICKSTART.md) | [Полная документация](./CONTENT-SYSTEM.md)

## Роли пользователей

- **user** - обычный пользователь (может создавать и редактировать свои отчеты)
- **admin** - администратор (полный доступ ко всем функциям + редактирование контента)

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
