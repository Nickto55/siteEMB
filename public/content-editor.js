/**
 * Пакет для администраторов для редактирования контента страниц
 */

class ContentEditor {
    constructor(options = {}) {
        this.apiBaseUrl = options.apiBaseUrl || '/api/content';
        this.isAdmin = options.isAdmin || false;
        this.editableElements = new Map();
    }

    /**
     * Получить все страницы (только для админов)
     */
    async getAllPages() {
        if (!this.isAdmin) {
            console.error('❌ Доступ запрещен. Требуются права администратора');
            return null;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/admin/all`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('❌ Ошибка при получении списка страниц:', error);
            return null;
        }
    }

    /**
     * Получить содержимое страницы для редактирования
     */
    async getPageForEditing(pageName) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/${pageName}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            return data.data || null;
        } catch (error) {
            console.error(`❌ Ошибка при получении ${pageName}:`, error);
            return null;
        }
    }

    /**
     * Сохранить обновленный контент
     */
    async savePageContent(pageName, { title, content }) {
        if (!this.isAdmin) {
            console.error('❌ Доступ запрещен. Требуются права администратора');
            return false;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/${pageName}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ title, content })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log(`✓ Контент ${pageName} успешно сохранен`);
            return data.data;
        } catch (error) {
            console.error(`❌ Ошибка при сохранении ${pageName}:`, error);
            return false;
        }
    }

    /**
     * Получить историю версий страницы
     */
    async getPageHistory(pageName) {
        if (!this.isAdmin) {
            console.error('❌ Доступ запрещен. Требуются права администратора');
            return null;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/${pageName}/history`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error(`❌ Ошибка при получении истории ${pageName}:`, error);
            return null;
        }
    }

    /**
     * Создать новую страницу
     */
    async createPage(pageName, { title, content }) {
        if (!this.isAdmin) {
            console.error('❌ Доступ запрещен. Требуются права администратора');
            return false;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/page`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ pageName, title, content })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log(`✓ Страница ${pageName} успешно создана`);
            return data.data;
        } catch (error) {
            console.error(`❌ Ошибка при создании ${pageName}:`, error);
            return false;
        }
    }

    /**
     * Удалить страницу
     */
    async deletePage(pageName) {
        if (!this.isAdmin) {
            console.error('❌ Доступ запрещен. Требуются права администратора');
            return false;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/${pageName}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `HTTP ${response.status}`);
            }

            console.log(`✓ Страница ${pageName} успешно удалена`);
            return true;
        } catch (error) {
            console.error(`❌ Ошибка при удалении ${pageName}:`, error);
            return false;
        }
    }

    /**
     * Включить встроенное редактирование для элемента
     */
    enableInlineEditing(elementId, pageName) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`❌ Элемент #${elementId} не найден`);
            return;
        }

        if (!this.isAdmin) return; // Скрыть кнопки редактирования если не админ

        element.contentEditable = true;
        element.classList.add('editable-content');

        // Добавить стили для редактируемого контента
        this.addEditableStyles();

        // Добавить обработчик для сохранения
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Сохранить';
        saveButton.className = 'btn-save-content';
        saveButton.onclick = async () => {
            const newContent = element.innerHTML;
            await this.savePageContent(pageName, {
                title: document.title,
                content: newContent
            });
        };

        element.parentElement.insertBefore(saveButton, element.nextSibling);
    }

    /**
     * Добавить базовые стили для редактируемого контента
     */
    addEditableStyles() {
        if (document.getElementById('editable-content-styles')) return;

        const style = document.createElement('style');
        style.id = 'editable-content-styles';
        style.textContent = `
            .editable-content {
                border: 2px dashed rgba(93, 140, 48, 0.3);
                padding: 10px;
                border-radius: 4px;
                outline: none;
                transition: border-color 0.2s;
            }
            
            .editable-content:focus {
                border-color: rgba(93, 140, 48, 0.8);
                background-color: rgba(93, 140, 48, 0.05);
            }
            
            .btn-save-content {
                background-color: #5D8C30;
                color: white;
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 10px;
                font-weight: 500;
            }
            
            .btn-save-content:hover {
                background-color: #7EB342;
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Глобальный экземпляр редактора
 */
const contentEditor = new ContentEditor();

// Экспортировать для использования в других скриптах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentEditor;
}
