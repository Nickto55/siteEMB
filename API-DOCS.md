# 📚 API Документация - Система контента

Полный справочник API endpoints для системы управления контентом страниц.

## 📍 Base URL

```
http://localhost:3000/api/content
```

## 🔑 Аутентификация

Для всех защищённых endpoints требуется JWT токен в заголовке:

```http
Authorization: Bearer <YOUR_JWT_TOKEN>
```

## 📖 Endpoints

### 1. Получить контент страницы

**Публичный доступ** ✓ (без аутентификации)

```http
GET /api/content/:pageName
```

#### Параметры пути:
- `pageName` (string, required) - Название страницы (например: `rules-glossary`)

#### Пример запроса:
```bash
curl http://localhost:3000/api/content/rules-glossary
```

#### Успешный ответ (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "page_name": "rules-glossary",
    "title": "Глоссарий - EmbroMine",
    "content": "<!DOCTYPE html>...",
    "version": 1
  }
}
```

#### Ошибка (404):
```json
{
  "error": "Контент страницы не найден"
}
```

---

### 2. Получить историю версий страницы

**Требует: Admin** 🔒

```http
GET /api/content/:pageName/history
Authorization: Bearer <token>
```

#### Параметры пути:
- `pageName` (string, required) - Название страницы

#### Пример запроса:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/content/rules-glossary/history
```

#### Успешный ответ (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "version": 1,
      "created_at": "2025-02-24T10:30:45.123Z",
      "created_by": "admin_user"
    },
    {
      "id": 4,
      "version": 2,
      "created_at": "2025-02-24T11:15:22.456Z",
      "created_by": "editor_user"
    }
  ]
}
```

---

### 3. Обновить контент страницы

**Требует: Admin** 🔒

```http
PUT /api/content/:pageName
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Новый заголовок",
  "content": "<html>...</html>"
}
```

#### Параметры пути:
- `pageName` (string, required) - Название страницы

#### Тело запроса:
- `title` (string, optional) - Новый заголовок страницы
- `content` (string, required) - HTML контент страницы

#### Пример запроса:
```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Новый заголовок",
    "content": "<h1>Новый контент</h1>"
  }' \
  http://localhost:3000/api/content/rules-glossary
```

#### Успешный ответ (200):
```json
{
  "success": true,
  "message": "Контент успешно обновлен",
  "data": {
    "id": 1,
    "page_name": "rules-glossary",
    "title": "Новый заголовок",
    "content": "<h1>Новый контент</h1>",
    "version": 2,
    "updated_at": "2025-02-24T12:00:00.000Z"
  }
}
```

#### Ошибка (400):
```json
{
  "error": "Контент обязателен"
}
```

---

### 4. Создать новую страницу

**Требует: Admin** 🔒

```http
POST /api/content/page
Authorization: Bearer <token>
Content-Type: application/json

{
  "pageName": "new-page",
  "title": "Новая страница",
  "content": "<html>...</html>"
}
```

#### Тело запроса:
- `pageName` (string, required) - Уникальное название страницы
- `title` (string, optional) - Заголовок страницы
- `content` (string, required) - HTML контент

#### Пример запроса:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pageName": "new-page",
    "title": "Новая страница",
    "content": "<h1>Добро пожаловать</h1>"
  }' \
  http://localhost:3000/api/content/page
```

#### Успешный ответ (201):
```json
{
  "success": true,
  "message": "Страница успешно создана",
  "data": {
    "id": 10,
    "page_name": "new-page",
    "title": "Новая страница",
    "content": "<h1>Добро пожаловать</h1>",
    "version": 1
  }
}
```

#### Ошибка (400):
```json
{
  "error": "Страница с таким названием уже существует"
}
```

---

### 5. Получить все страницы

**Требует: Admin** 🔒

```http
GET /api/content/admin/all
Authorization: Bearer <token>
```

#### Пример запроса:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/content/admin/all
```

#### Успешный ответ (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "page_name": "index",
      "title": "Главная",
      "is_active": true,
      "version": 3,
      "updated_at": "2025-02-24T10:00:00.000Z"
    },
    {
      "id": 2,
      "page_name": "rules-glossary",
      "title": "Глоссарий",
      "is_active": true,
      "version": 2,
      "updated_at": "2025-02-24T11:30:00.000Z"
    },
    {
      "id": 3,
      "page_name": "rules-guide",
      "title": "Руководство",
      "is_active": false,
      "version": 1,
      "updated_at": "2025-02-23T09:15:00.000Z"
    }
  ]
}
```

---

### 6. Удалить страницу

**Требует: Admin** 🔒

```http
DELETE /api/content/:pageName
Authorization: Bearer <token>
```

#### Параметры пути:
- `pageName` (string, required) - Название страницы для удаления

#### Пример запроса:
```bash
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/content/rules-glossary
```

#### Успешный ответ (200):
```json
{
  "success": true,
  "message": "Страница успешно удалена"
}
```

#### Ошибка (404):
```json
{
  "error": "Страница не найдена"
}
```

---

## 🔄 Коды ответов

| Код | Описание |
|-----|----------|
| 200 | OK - Успешный запрос |
| 201 | Created - Ресурс успешно создан |
| 400 | Bad Request - Неправильные параметры |
| 401 | Unauthorized - Требуется аутентификация |
| 403 | Forbidden - Требуются права администратора |
| 404 | Not Found - Ресурс не найден |
| 500 | Internal Server Error - Ошибка сервера |

---

## 🧪 Примеры использования

### JavaScript (Fetch API)

```javascript
// Получить контент
async function getPageContent(pageName) {
  const response = await fetch(`/api/content/${pageName}`);
  const data = await response.json();
  return data.data;
}

// Обновить контент (требует токен)
async function updatePageContent(pageName, title, content) {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/content/${pageName}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title, content })
  });
  return response.json();
}

// Получить все страницы (админы)
async function getAllPages() {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/content/admin/all', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}
```

### cURL примеры

```bash
# Получить контент (публичный доступ)
curl http://localhost:3000/api/content/rules-glossary | jq

# Получить все страницы (с авторизацией)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/content/admin/all | jq

# Обновить контент
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Новая версия","content":"<h1>Привет</h1>"}' \
  http://localhost:3000/api/content/rules-glossary | jq
```

### Node.js (axios)

```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3000/api/content',
  headers: {
    'Authorization': `Bearer ${process.env.JWT_TOKEN}`
  }
});

// Получить контент
api.get('/rules-glossary')
  .then(res => console.log(res.data))
  .catch(err => console.error(err));

// Обновить контент
api.put('/rules-glossary', {
  title: 'Новый заголовок',
  content: '<h1>Новый контент</h1>'
})
  .then(res => console.log('Сохранено:', res.data))
  .catch(err => console.error('Ошибка:', err.message));
```

---

## 📊 Структура данных

### Page Content Object

```typescript
{
  id: number;              // Уникальный ID
  page_name: string;       // Название страницы (уникально)
  title: string | null;    // Заголовок страницы
  content: string;         // HTML контент
  is_active: boolean;      // Активна ли страница
  version: number;         // Номер версии
  created_at: string;      // ISO дата создания
  updated_at: string;      // ISO дата обновления
  updated_by: number | null; // ID пользователя, обновившего
}
```

### Page History Object

```typescript
{
  id: number;              // ID записи в истории
  version: number;         // Номер версии
  created_at: string;      // ISO дата сохранения
  created_by: string;      // Имя пользователя
}
```

---

## 🔐 Безопасность

✅ **Аутентификация**: JWT токен обязателен для всех операций редактирования  
✅ **Авторизация**: Только администраторы могут редактировать контент  
✅ **Валидация**: Все входные данные проверяются  
✅ **SQL Injection**: Защита через параметризованные запросы  
✅ **CORS**: Настроен для безопасного доступа  

---

## 💡 Советы

1. **Используйте кэширование** - контент редко меняется, кэшируйте результаты
2. **Пакеты изменений** - обновляйте весь контент сразу, а не частями
3. **Отслеживание истории** - все версии сохраняются автоматически
4. **Версионирование** - используйте версии для отката при необходимости
5. **Логирование** - все операции редактирования записываются с ID пользователя

---

## 🐛 Troubleshooting

**401 Unauthorized** - Проверьте что токен указан и не истек  
**403 Forbidden** - Пользователь не имеет прав администратора  
**404 Not Found** - Страница с таким названием не существует  
**500 Internal Server Error** - Проверьте логи сервера  

Подробнее: [CONTENT-SYSTEM.md](./CONTENT-SYSTEM.md#-troubleshooting)
