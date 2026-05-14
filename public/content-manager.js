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
     */
    async init() {
        if (this.initialized) return;

        try {
            console.log('📖 Инициализация системы загрузки контента...');

            const currentPage = this.getCurrentPageName();
            console.log(`📄 Текущая страница: ${currentPage}`);

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
            if (this.cacheEnabled && this.cache.has(pageName)) {
                console.log(`📚 Используется кэшированный контент для ${pageName}`);
                const cachedContent = this.cache.get(pageName);
                this.applyContent(pageName, cachedContent);
                return;
            }

            console.log(`🔄 Загружаю контент для ${pageName}...`);

            const response = await fetch(`${this.apiBaseUrl}/${pageName}`);

            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`⚠ Контент страницы ${pageName} не найден в БД`);
                    this.showFallback(pageName);
                } else {
                    console.warn(`⚠ Ошибка загрузки ${pageName}: ${response.status}`);
                    this.showError(pageName, response.status);
                }
                return;
            }

            const data = await response.json();

            if (data.success && data.data) {
                if (this.cacheEnabled) {
                    this.cache.set(pageName, data.data);
                }

                this.applyContent(pageName, data.data);
                console.log(`✓ Контент ${pageName} успешно загружен`);
            }
        } catch (error) {
            console.error(`❌ Ошибка при загрузке контента ${pageName}:`, error);
            this.showError(pageName, 'network');
        }
    }

    /**
     * Применить загруженный контент к странице
     */
    applyContent(pageName, contentData) {
        const { title, content } = contentData;

        if (title) {
            document.title = title;
        }

        const contentElement = document.getElementById('dynamic-content') ||
            document.querySelector('main') ||
            document.querySelector('[role="main"]');

        if (contentElement && content) {
            if (content.includes('<html') || content.includes('<body')) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = content;
                const body = tempDiv.querySelector('body');
                if (body) {
                    contentElement.innerHTML = body.innerHTML;
                } else {
                    contentElement.innerHTML = content;
                }
            } else {
                contentElement.innerHTML = content;
            }

            this.reinitializeScripts(contentElement);
            this.fadeIn(contentElement);
        }

        this.contentElements.set(pageName, contentElement);
    }

    /**
     * Плавно показать контент
     */
    fadeIn(element) {
        element.classList.remove('opacity-0');
        element.classList.add('opacity-100');
    }

    /**
     * Показать fallback если контент не найден
     */
    showFallback(pageName) {
        const el = document.getElementById('dynamic-content');
        if (!el) return;

        el.innerHTML = `
            <div class="text-center py-20">
                <div class="text-4xl mb-4">📄</div>
                <h2 class="text-xl font-bold text-gray-300 mb-2">Контент не найден</h2>
                <p class="text-gray-500 mb-4">Страница "${pageName}" ещё не создана в базе данных.</p>
                <a href="admin-panel.html" class="inline-block px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-all">
                    Перейти в админ-панель
                </a>
            </div>
        `;
        this.fadeIn(el);
    }

    /**
     * Показать ошибку загрузки
     */
    showError(pageName, status) {
        const el = document.getElementById('dynamic-content');
        if (!el) return;

        el.innerHTML = `
            <div class="text-center py-20">
                <div class="text-4xl mb-4">⚠️</div>
                <h2 class="text-xl font-bold text-gray-300 mb-2">Ошибка загрузки</h2>
                <p class="text-gray-500">Не удалось загрузить контент страницы "${pageName}" (${status}).</p>
            </div>
        `;
        this.fadeIn(el);
    }

    /**
     * Переинициализировать скрипты в загруженном контенте
     */
    reinitializeScripts(containerElement) {
        const scripts = containerElement.querySelectorAll('script');
        scripts.forEach(script => {
            const newScript = document.createElement('script');
            if (script.src) {
                newScript.src = script.src;
            } else {
                newScript.textContent = script.textContent;
            }
            script.parentNode.replaceChild(newScript, script);
        });
    }

    clearCache() {
        this.cache.clear();
        console.log('🗑️ Кэш очищен');
    }

    getCachedContent(pageName) {
        return this.cache.get(pageName) || null;
    }

    registerContentElement(elementId, pageName) {
        const element = document.getElementById(elementId);
        if (element) {
            this.contentElements.set(pageName, element);
            console.log(`✓ Зарегистрирован элемент ${elementId} для ${pageName}`);
        }
    }

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

const pageContentManager = new PageContentManager();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        pageContentManager.init();
    });
} else {
    pageContentManager.init();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PageContentManager;
}
