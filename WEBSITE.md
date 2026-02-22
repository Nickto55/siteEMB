# Website - Документация

## Описание

Website контейнер представляет собой Express.js веб-приложение, которое предоставляет REST API для управления пользователями, отчетами и административными функциями. Приложение использует PostgreSQL для хранения данных и JWT для аутентификации.

## Технические требования

### Зависимости

- **Node.js**: 18+ (рекомендуется LTS версия)
- **npm**: 8+
- **PostgreSQL**: 15+ (предоставляется отдельным контейнером)

### Основные npm пакеты

```json
{
  "express": "^4.18.2",
  "pg": "^8.11.3",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "dotenv": "^16.3.1",
  "cors": "^2.8.5",
  "express-validator": "^7.0.0",
  "helmet": "^7.1.0"
}
```

## Структура проекта

```
website/
├── server.js           # Главный файл сервера
├── db.js              # Конфигурация подключения к БД
├── package.json       # Зависимости проекта
├── middleware/
│   └── auth.js       # Middleware для аутентификации
└── routes/
    ├── auth.js       # Роуты аутентификации
    ├── admin.js      # Административные роуты
    └── reports.js    # Роуты для работы с отчетами
```

## Конфигурация (.env)

### Обязательные переменные окружения

```env
# Сервер
PORT=3000                    # Порт веб-сервера
NODE_ENV=production          # Режим работы (production/development)

# База данных
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/serverreport

# JWT аутентификация
JWT_SECRET=<секретный_ключ>  # Должен быть надежным и уникальным
JWT_EXPIRES_IN=7d            # Время жизни токена

# CORS
CORS_ORIGIN=*                # Разрешенные источники для CORS
```

## Подключение к базе данных

### Требования к БД

1. **PostgreSQL 15+** (контейнер `postgres`)
2. **Инициализация БД** выполняется через `database/init.sql`
3. **Основные таблицы**:
   - `users` - пользователи системы
   - `reports` - отчеты пользователей
   - `comments` - комментарии к отчетам
   - `attachments` - вложения к отчетам
   - `discord_integrations` - интеграция с Discord
   - `telegram_integrations` - интеграция с Telegram

### Подключение из кода

```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
});
```

## API эндпоинты

### Аутентификация (`/api/auth`)

- `POST /api/auth/register` - Регистрация нового пользователя
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/logout` - Выход из системы
- `GET /api/auth/me` - Получение текущего пользователя

### Отчеты (`/api/reports`)

- `GET /api/reports` - Список отчетов (требует авторизацию)
- `POST /api/reports` - Создание нового отчета
- `GET /api/reports/:id` - Получение отчета по ID
- `PUT /api/reports/:id` - Обновление отчета
- `DELETE /api/reports/:id` - Удаление отчета

### Администрирование (`/api/admin`)

- `GET /api/admin/users` - Список всех пользователей (только админ)
- `PUT /api/admin/users/:id` - Управление пользователем
- `GET /api/admin/reports` - Все отчеты
- `GET /api/admin/stats` - Статистика системы

### Health Check

- `GET /health` - Проверка работоспособности сервиса

## Docker интеграция

### Dockerfile требования

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

### Docker Compose зависимости

Website контейнер **зависит от**:
- `postgres` - база данных должна быть запущена первой

```yaml
website:
  build: ./website
  ports:
    - "3000:3000"
  depends_on:
    - postgres
  environment:
    - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/serverreport
```

## Безопасность

### Обязательные практики

1. **Helmet** - защита HTTP заголовков
2. **CORS** - настройка разрешенных источников
3. **Валидация** - использование express-validator для всех входных данных
4. **JWT** - безопасное хранение и проверка токенов
5. **Bcrypt** - хеширование паролей с salt rounds ≥ 10

### Рекомендации

- Использовать HTTPS в production
- Регулярно обновлять зависимости
- Не хранить секретные ключи в коде
- Использовать переменные окружения для конфигурации

## Запуск и развертывание

### Локальный запуск (разработка)

```bash
cd website
npm install
npm run dev  # с nodemon
```

### Запуск в Docker

```bash
# Из корня проекта
./manage.sh
# Выбрать: 1 - Запустить все сервисы
```

### Развертывание нового проекта

```bash
# Из корня проекта
./manage.sh
# Выбрать: 24 - Настроить проект сайта (Git)
```

#### Проверка совместимости при развертывании

При установке проекта из Git репозитория автоматически выполняется проверка совместимости:

**Критические требования** (обязательны):
- ✓ Наличие файла `package.json` с валидным JSON
- ✓ Наличие файла `server.js`
- ✓ Использование Express.js в server.js

**Рекомендуемые требования**:
- Зависимости: express, pg, dotenv
- Директории: routes/, middleware/
- Dockerfile для контейнеризации
- Скрипт запуска app.listen() в server.js

Если проект не соответствует критическим требованиям, установка будет отменена с детальным описанием проблем.

## Мониторинг и логи

### Просмотр логов

```bash
# Через manage.sh
./manage.sh
# Выбрать: 6 - Просмотр логов Website

# Через docker-compose
cd docker
docker-compose logs -f website
```

### Health check

```bash
curl http://localhost:3000/health
# Ответ: {"status":"ok","timestamp":"..."}
```

## Типичные проблемы и решения

### Ошибка подключения к БД

**Проблема**: `ECONNREFUSED` или `Connection refused`

**Решение**:
- Убедитесь, что PostgreSQL контейнер запущен
- Проверьте `DATABASE_URL` в `.env`
- Проверьте сетевые настройки Docker

### JWT ошибки

**Проблема**: `jwt malformed` или `invalid signature`

**Решение**:
- Проверьте наличие `JWT_SECRET` в `.env`
- Убедитесь, что токен передается в заголовке `Authorization: Bearer <token>`
- Проверьте срок действия токена

### Порт уже занят

**Проблема**: `Port 3000 is already in use`

**Решение**:
- Измените `PORT` в `.env`
- Остановите другие процессы на порту 3000
- Проверьте запущенные контейнеры: `docker ps`

## Производительность

### Рекомендации

- **Connection pooling**: используется pg Pool для управления подключениями
- **Индексы БД**: убедитесь, что `init.sql` создал все индексы
- **Кеширование**: рассмотрите использование Redis для сессий и кеша
- **Лимиты**: используйте пагинацию для больших списков данных

## Интеграция с другими сервисами

### Discord Bot

Website предоставляет API для Discord бота:
- Создание отчетов через Discord команды
- Проверка статуса пользователей
- Получение статистики

### Telegram Bot

Аналогичная интеграция с Telegram ботом через REST API

## Обновление и миграции

### Обновление зависимостей

```bash
cd website
npm update
npm audit fix  # Исправление уязвимостей
```

### Миграции БД

При изменении структуры БД:
1. Создайте новый SQL скрипт в `database/migrations/`
2. Примените миграцию вручную или через скрипт
3. Обновите `init.sql` для новых установок

## Контакты и поддержка

- GitHub: [Репозиторий проекта]
- Документация API: `/api-docs` (при наличии Swagger)
- Логи: `./manage.sh` → пункт 6
