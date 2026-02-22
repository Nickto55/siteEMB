# Примеры API запросов

> Замените `YOUR_TOKEN_HERE` на реальный JWT токен, полученный при входе

## Аутентификация

### 1. Регистрация пользователя

```
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "ivan@example.com",
  "password": "password123",
  "name": "Иван Петров"
}
```

**Ответ:**
```json
{
  "message": "Пользователь успешно зарегистрирован",
  "user": {
    "id": 1,
    "email": "ivan@example.com",
    "name": "Иван Петров"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Вход в систему

```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "ivan@example.com",
  "password": "password123"
}
```

**Ответ:**
```json
{
  "message": "Успешный вход",
  "user": {
    "id": 1,
    "email": "ivan@example.com",
    "name": "Иван Петров"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Получить текущего пользователя

```
GET http://localhost:3000/api/auth/me
Authorization: Bearer YOUR_TOKEN_HERE
```

**Ответ:**
```json
{
  "id": 1,
  "email": "ivan@example.com",
  "name": "Иван Петров"
}
```

### 4. Выход из системы

```
POST http://localhost:3000/api/auth/logout
Authorization: Bearer YOUR_TOKEN_HERE
```

**Ответ:**
```json
{
  "message": "Успешный выход из системы"
}
```

## Отчеты

### 1. Создать отчет

```
POST http://localhost:3000/api/reports
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "title": "Квартальный отчет Q1",
  "description": "Отчет о работе за первый квартал 2026 года"
}
```

**Ответ:**
```json
{
  "message": "Отчет успешно создан",
  "report": {
    "id": 1,
    "title": "Квартальный отчет Q1",
    "description": "Отчет о работе за первый квартал 2026 года",
    "created_at": "2026-02-23T10:00:00.000Z",
    "user_id": 1
  }
}
```

### 2. Получить все отчеты

```
GET http://localhost:3000/api/reports
Authorization: Bearer YOUR_TOKEN_HERE
```

**Ответ:**
```json
[
  {
    "id": 1,
    "title": "Квартальный отчет Q1",
    "description": "Отчет о работе за первый квартал 2026 года",
    "created_at": "2026-02-23T10:00:00.000Z",
    "user_id": 1,
    "name": "Иван Петров"
  }
]
```

### 3. Получить отчет по ID

```
GET http://localhost:3000/api/reports/1
Authorization: Bearer YOUR_TOKEN_HERE
```

**Ответ:**
```json
{
  "id": 1,
  "title": "Квартальный отчет Q1",
  "description": "Отчет о работе за первый квартал 2026 года",
  "created_at": "2026-02-23T10:00:00.000Z",
  "user_id": 1,
  "name": "Иван Петров"
}
```

### 4. Обновить отчет

```
PUT http://localhost:3000/api/reports/1
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "title": "Квартальный отчет Q1 (обновленный)",
  "description": "Обновленное описание отчета"
}
```

**Ответ:**
```json
{
  "message": "Отчет успешно обновлен",
  "report": {
    "id": 1,
    "title": "Квартальный отчет Q1 (обновленный)",
    "description": "Обновленное описание отчета",
    "created_at": "2026-02-23T10:00:00.000Z",
    "user_id": 1
  }
}
```

### 5. Удалить отчет

```
DELETE http://localhost:3000/api/reports/1
Authorization: Bearer YOUR_TOKEN_HERE
```

**Ответ:**
```json
{
  "message": "Отчет успешно удален"
}
```

## Администрирование

### 1. Получить всех пользователей

```
GET http://localhost:3000/api/admin/users
Authorization: Bearer ADMIN_TOKEN_HERE
```

**Ответ:**
```json
[
  {
    "id": 1,
    "email": "admin@example.com",
    "name": "Администратор",
    "is_admin": true,
    "created_at": "2026-02-23T09:00:00.000Z"
  },
  {
    "id": 2,
    "email": "user@example.com",
    "name": "Обычный пользователь",
    "is_admin": false,
    "created_at": "2026-02-23T10:00:00.000Z"
  }
]
```

### 2. Получить статистику

```
GET http://localhost:3000/api/admin/stats
Authorization: Bearer ADMIN_TOKEN_HERE
```

**Ответ:**
```json
{
  "totalUsers": 2,
  "totalReports": 5,
  "totalComments": 12
}
```

### 3. Удалить пользователя

```
DELETE http://localhost:3000/api/admin/users/2
Authorization: Bearer ADMIN_TOKEN_HERE
```

**Ответ:**
```json
{
  "message": "Пользователь user@example.com успешно удален"
}
```

## Проверка здоровья

### Проверить статус сервера

```
GET http://localhost:3000/health
```

**Ответ:**
```json
{
  "status": "OK",
  "message": "Сервер работает"
}
```
