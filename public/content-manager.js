/**
 * Система динамической загрузки контента страниц из БД
 * Автоматически подгружает и обновляет содержимое страниц
 */

class PageContentManager {
    constructor(options = {}) {
        this.apiBaseUrl = options.apiBaseUrl || '/api/content';
        this.cacheEnabled = options.cacheEnabled !== false;
        this.cache = new Map();
        this.contentElements = new Map();
        this.initialized = false;
    }

    /**
     * Инициализация системы
     * Должна быть вызвана в конце HTML страницы
     */
    async init() {
        if (this.initialized) return;

        try {
            console.log('📖 Инициализация системы загрузки контента...');

            // Получить название текущей страницы
            const currentPage = this.getCurrentPageName();
            console.log(`📄 Текущая страница: ${currentPage}`);

            // Загрузить контент страницы
            await this.loadPageContent(currentPage);

            this.initialized = true;
            console.log('✓ Система загрузки контента инициализирована');
        } catch (error) {
            console.error('❌ Ошибка при инициализации:', error);
        }
    }

    /**
     * Получить название текущей страницы из URL
     */
    getCurrentPageName() {
        const pathname = window.location.pathname;
        const filename = pathname.substring(pathname.lastIndexOf('/') + 1) || 'index';
        return filename.replace('.html', '');
    }

    /**
     * Загрузить контент страницы из БД
     */
    async loadPageContent(pageName) {
        try {
            // Проверить кэш
            if (this.cacheEnabled && this.cache.has(pageName)) {
                console.log(`📚 Используется кэшированный контент для ${pageName}`);
                const cachedContent = this.cache.get(pageName);
                this.applyContent(pageName, cachedContent);
                return;
            }

            console.log(`🔄 Загужаю контент для ${pageName}...`);

            const response = await fetch(`${this.apiBaseUrl}/${pageName}`);

            if (!response.ok) {
                console.warn(`⚠ Контент страницы ${pageName} не найден в БД (${response.status})`);
                return;
            }

            const data = await response.json();

            if (data.success && data.data) {
                // Сохранить в кэш
                if (this.cacheEnabled) {
                    this.cache.set(pageName, data.data);
                }

                // Применить контент
                this.applyContent(pageName, data.data);
                console.log(`✓ Контент ${pageName} успешно загружен`);
            }
        } catch (error) {
            console.error(`❌ Ошибка при загрузке контента ${pageName}:`, error);
        }
    }

    /**
     * Применить загруженный контент к странице
     */
    applyContent(pageName, contentData) {
        const { title, content } = contentData;

        // Обновить title страницы
        if (title) {
            document.title = title;
        }

        // Обновить или заменить основной контент
        // Ищет элемент с id='dynamic-content' или основной контент элемент
        const contentElement = document.getElementById('dynamic-content') ||
            document.querySelector('main') ||
            document.querySelector('[role="main"]');

        if (contentElement && content) {
            // Если это полная HTML страница, содержит <html> или <body>
            if (content.includes('<html') || content.includes('<body')) {
                // Это полная страница - извлечь только контент из body
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = content;
                const body = tempDiv.querySelector('body');
                if (body) {
                    contentElement.innerHTML = body.innerHTML;
                }
            } else {
                // Это фрагмент контента
                contentElement.innerHTML = content;
            }

            // Переинициализировать скрипты если нужно
            this.reinitializeScripts(contentElement);
        }

        // Сохранить ссылку на элемент контента
        this.contentElements.set(pageName, contentElement);
    }

    /**
     * Переинициализировать скрипты в загруженном контенте
     */
    reinitializeScripts(containerElement) {
        // Переинициализировать Tailwind если usado
        if (window.tailwind && window.tailwind.preflight) {
            try {
                // Это может не быть необходимо, но добавлен на случай
                console.log('📦 Переинициализирую Tailwind...');
            } catch (error) {
                console.warn('⚠ Ошибка при переинициализации Tailwind:', error);
            }
        }

        // Переинициализировать локальные скрипты если они есть
        const scripts = containerElement.querySelectorAll('script');
        scripts.forEach(script => {
            const newScript = document.createElement('script');
            newScript.textContent = script.textContent;
            script.parentNode.replaceChild(newScript, script);
        });
    }

    /**
     * Очистить кэш
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Кэш очищен');
    }

    /**
     * Получить кэшированный контент
     */
    getCachedContent(pageName) {
        return this.cache.get(pageName) || null;
    }

    /**
     * Настроить элемент для динамической загрузки
     * Можно использовать для загрузки контента в отдельные элементы
     */
    registerContentElement(elementId, pageName) {
        const element = document.getElementById(elementId);
        if (element) {
            this.contentElements.set(pageName, element);
            console.log(`✓ Зарегистрирован элемент ${elementId} для ${pageName}`);
        }
    }

    /**
     * Загрузить контент в конкретный элемент
     */
    async loadContentIntoElement(elementId, pageName) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`❌ Элемент с id="${elementId}" не найден`);
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/${pageName}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            if (data.success && data.data) {
                element.innerHTML = data.data.content;
                this.reinitializeScripts(element);
                console.log(`✓ Контент загружен в ${elementId}`);
            }
        } catch (error) {
            console.error(`❌ Ошибка при загрузке контента в ${elementId}:`, error);
        }
    }
}

/**
 * Глобальный экземпляр менеджера контента
 */
const pageContentManager = new PageContentManager();

/**
 * Инициализировать при загрузке страницы
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        pageContentManager.init();
    });
} else {
    // Документ уже загружен
    pageContentManager.init();
}

// Экспортировать для использования в других скриптах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PageContentManager;
}
