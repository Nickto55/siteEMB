# 🔧 Примеры интеграции системы контента

Практические примеры интеграции системы управления контентом в существующее приложение.

## 1️⃣ Базовая интеграция на странице

### Вариант A: Автоматическая загрузка (рекомендуется)

**Самый простой способ** - добавьте одну строку перед `</body>`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Правила</title>
</head>
<body>
    <!-- Ваше содержимое здесь -->
    <main>
        <!-- Контент будет загружен сюда -->
    </main>

    <!-- Подугружаем скрипт загрузки контента -->
    <script src="/content-manager.js"></script>
</body>
</html>
```

**Что происходит автоматически:**
- ✓ Определяется название страницы из URL
- ✓ Загружается контент из БД
- ✓ Заменяется содержимое `<main>` или `#dynamic-content`
- ✓ Обновляется заголовок страницы (`<title>`)

### Вариант B: Ручная загрузка контента

```html
<!DOCTYPE html>
<html>
<head>
    <title>Моя страница</title>
</head>
<body>
    <div id="my-content">Загружаю контент...</div>

    <script src="/content-manager.js"></script>
    <script>
        // Загрузить контент конкретной страницы
        pageContentManager.loadPageContent('about');
        
        // Или загрузить в конкретный элемент
        pageContentManager.loadContentIntoElement('my-content', 'about');
    </script>
</body>
</html>
```

---

## 2️⃣ Админ-панель редактора

### Простая админ-панель

```html
<!DOCTYPE html>
<html>
<head>
    <title>Админ - Управление контентом</title>
    <style>
        body { font-family: Arial; margin: 20px; }
        .page-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .page-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
        button { padding: 8px 16px; background: #5D8C30; color: white; border: none; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>📖 Управление контентом</h1>
    <div class="page-list" id="pages"></div>

    <script src="/content-manager.js"></script>
    <script src="/content-editor.js"></script>
    <script>
        const editor = new ContentEditor({ isAdmin: true });

        // Загрузить список страниц
        async function loadPages() {
            const pages = await editor.getAllPages();
            
            const html = pages.map(page => `
                <div class="page-card">
                    <h3>${page.page_name}</h3>
                    <p>Версия: ${page.version}</p>
                    <p>Обновлена: ${new Date(page.updated_at).toLocaleDateString('ru-RU')}</p>
                    <button onclick="editPage('${page.page_name}')">Редактировать</button>
                </div>
            `).join('');
            
            document.getElementById('pages').innerHTML = html;
        }

        async function editPage(pageName) {
            const data = await editor.getPageForEditing(pageName);
            const newContent = prompt('Новый контент:', data.content.substring(0, 100) + '...');
            
            if (newContent) {
                await editor.savePageContent(pageName, {
                    title: data.title,
                    content: newContent
                });
                alert('✓ Сохранено!');
                loadPages();
            }
        }

        loadPages();
    </script>
</body>
</html>
```

---

## 3️⃣ WYSIWYG редактор интеграция

### С использованием TinyMCE

```html
<!DOCTYPE html>
<html>
<head>
    <title>Редактор контента</title>
    <!-- TinyMCE редактор -->
    <script src="https://cdn.tiny.cloud/1/YOUR_API_KEY/tinymce/6/tinymce.min.js"></script>
</head>
<body>
    <h1>Редактирование страницы</h1>
    
    <form id="editor-form">
        <div>
            <label>Название:</label>
            <input type="text" id="page-title" required>
        </div>

        <div>
            <label>Контент:</label>
            <textarea id="page-content" required></textarea>
        </div>

        <button type="button" onclick="savePage()">Сохранить</button>
    </form>

    <script src="/content-editor.js"></script>
    <script>
        // Инициализировать TinyMCE
        tinymce.init({
            selector: '#page-content',
            plugins: 'link image lists code',
            toolbar: 'undo redo | bold italic | link image | bullist numlist | code'
        });

        const editor = new ContentEditor({ isAdmin: true });
        const currentPageName = new URLSearchParams(window.location.search).get('page');

        // Загрузить существующий контент
        async function loadPage() {
            if (!currentPageName) return;
            
            const data = await editor.getPageForEditing(currentPageName);
            document.getElementById('page-title').value = data.title || '';
            tinymce.get('page-content').setContent(data.content);
        }

        // Сохранить контент
        async function savePage() {
            const title = document.getElementById('page-title').value;
            const content = tinymce.get('page-content').getContent();

            const result = await editor.savePageContent(currentPageName, { title, content });
            
            if (result) {
                alert('✓ Страница сохранена!');
            } else {
                alert('✗ Ошибка при сохранении!');
            }
        }

        loadPage();
    </script>
</body>
</html>
```

---

## 4️⃣ React компонент интеграция

### React hook для загрузки контента

```javascript
// usePageContent.js - Custom hook
import { useState, useEffect } from 'react';

export function usePageContent(pageName) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/content/${pageName}`);
        if (!response.ok) throw new Error('Контент не найден');
        
        const data = await response.json();
        setContent(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [pageName]);

  return { content, loading, error };
}

// Компонент использования
function PageContent({ pageName }) {
  const { content, loading, error } = usePageContent(pageName);

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div>
      <h1>{content?.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: content?.content }} />
    </div>
  );
}

export default PageContent;
```

### React компонент админ-панели

```javascript
// AdminPanel.jsx
import React, { useState, useEffect } from 'react';

function AdminPanel() {
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/content/admin/all', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setPages(data.data);
  };

  const handleSave = async (newContent) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/content/${selectedPage.page_name}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newContent)
    });

    if (response.ok) {
      alert('✓ Сохранено!');
      setEditing(false);
      loadPages();
    }
  };

  return (
    <div>
      <h1>Управление контентом</h1>
      <div className="pages-list">
        {pages.map(page => (
          <div key={page.id} className="page-card">
            <h3>{page.page_name}</h3>
            <button onClick={() => {
              setSelectedPage(page);
              setEditing(true);
            }}>
              Редактировать
            </button>
          </div>
        ))}
      </div>

      {editing && selectedPage && (
        <Editor 
          page={selectedPage} 
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
}

export default AdminPanel;
```

---

## 5️⃣ Vue.js компонент интеграция

### Vue 3 composable

```javascript
// usePageContent.js
import { ref, onMounted } from 'vue';

export function usePageContent(pageName) {
  const content = ref(null);
  const loading = ref(true);
  const error = ref(null);

  const fetchContent = async () => {
    try {
      const response = await fetch(`/api/content/${pageName}`);
      if (!response.ok) throw new Error('Контент не найден');
      
      const data = await response.json();
      content.value = data.data;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => fetchContent());

  return { content, loading, error, refetch: fetchContent };
}
```

### Vue компонент

```vue
<!-- PageView.vue -->
<template>
  <div>
    <div v-if="loading" class="loading">Загрузка...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <h1>{{ content?.title }}</h1>
      <div v-html="content?.content"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { usePageContent } from '@/composables/usePageContent';

const props = defineProps({
  pageName: String
});

const { content, loading, error } = usePageContent(
  computed(() => props.pageName)
);
</script>
```

---

## 6️⃣ Многоязычная поддержка (i18n)

### С интеграцией vue-i18n

```javascript
// После загрузки контента, сохраните его в i18n
async function loadLocalizedContent() {
  const pages = await Promise.all([
    fetch('/api/content/rules-ru').then(r => r.json()),
    fetch('/api/content/rules-en').then(r => r.json()),
  ]);

  const messages = {
    ru: { page: { rules: pages[0].data.content } },
    en: { page: { rules: pages[1].data.content } }
  };

  i18n.global.setLocaleMessage('ru', messages.ru);
  i18n.global.setLocaleMessage('en', messages.en);
}
```

---

## 7️⃣ Кэширование и оптимизация

### IndexedDB кэш

```javascript
// cache-manager.js
const DB_NAME = 'SiteEMBCache';
const STORE_NAME = 'pages';

export class CacheManager {
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPage(pageName) {
    const db = await this.init();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME);
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(pageName);
      
      request.onsuccess = () => resolve(request.result);
    });
  }

  async savePage(pageName, data) {
    const db = await this.init();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      
      store.put({
        ...data,
        cachedAt: Date.now()
      }, pageName);
      
      tx.oncomplete = () => resolve(true);
    });
  }

  async clearOldCache(maxAgeDays = 7) {
    const db = await this.init();
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      request.result.forEach((item, key) => {
        if (now - item.cachedAt > maxAge) {
          store.delete(key);
        }
      });
    };
  }
}
```

---

## 📝 Лучшие практики

1. **Кэширование**
   ```javascript
   // Первый раз загружаем из БД, потом из кэша
   const content = pageContentManager.getCachedContent('rules')
     || await pageContentManager.loadPageContent('rules');
   ```

2. **Обработка ошибок**
   ```javascript
   try {
     await pageContentManager.loadPageContent('page');
   } catch (error) {
     console.error('Не удалось загрузить контент:', error);
     // Показать fallback контент или сообщение об ошибке
   }
   ```

3. **Изоляция контента**
   ```javascript
   // Используйте отдельный элемент для динамического контента
   <div id="dynamic-content"></div>
   
   pageContentManager.loadContentIntoElement('dynamic-content', 'rules');
   ```

4. **Отслеживание обновлений**
   ```javascript
   // Проверяйте версию контента
   const latestContent = await pageContentManager.loadPageContent('rules');
   if (latestContent.version > currentVersion) {
     console.log('✓ Контент обновлен');
   }
   ```

---

## 🔗 Дополнительные ресурсы

- [API Документация](./API-DOCS.md)
- [Полное руководство](./CONTENT-SYSTEM.md)
- [Быстрый старт](./QUICKSTART.md)
