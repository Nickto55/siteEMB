// API базовый URL
const API_URL = '/api';

// Глобальные переменные
let currentUser = null;
let authToken = null;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

// Проверка аутентификации
function checkAuth() {
    authToken = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');

    if (authToken && userData) {
        currentUser = JSON.parse(userData);

        // Проверяем, на какой странице мы находимся
        const currentPage = window.location.pathname.split('/').pop();

        // Если на dashboard.html - показываем содержимое
        if (currentPage === 'dashboard.html') {
            showMainSection();
            loadReports();
        }
        // Если на login.html и уже авторизован - перенаправляем на dashboard
        else if (currentPage === 'login.html') {
            window.location.href = 'dashboard.html';
        }
    } else {
        // Если не авторизован и находится на dashboard, перенаправляем на login
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage === 'dashboard.html') {
            window.location.href = 'login.html';
        } else if (currentPage === 'login.html') {
            showAuthSection();
        }
    }
}

// Переключение вкладок аутентификации
function switchTab(tab) {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (tab === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
    }
}

// Регистрация
async function register(event) {
    event.preventDefault();

    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Регистрация успешна! Теперь войдите в систему', 'success');
            switchTab('login');
            document.getElementById('login-username').value = username;
            event.target.reset();
        } else {
            showNotification(data.error || 'Ошибка регистрации', 'error');
        }
    } catch (error) {
        showNotification('Ошибка подключения к серверу', 'error');
    }
}

// Вход
async function login(event) {
    event.preventDefault();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;

            localStorage.setItem('authToken', authToken);
            localStorage.setItem('userData', JSON.stringify(currentUser));

            showNotification(`Добро пожаловать, ${currentUser.username}!`, 'success');

            // Перенаправление на dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
        } else {
            showNotification(data.error || 'Ошибка входа', 'error');
        }
    } catch (error) {
        showNotification('Ошибка подключения к серверу', 'error');
    }
}

// Выход
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    authToken = null;
    currentUser = null;
    showNotification('Вы вышли из системы', 'info');

    // Перенаправление на главную страницу
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 500);
}

// Создание отчета
async function createReport(event) {
    event.preventDefault();

    const title = document.getElementById('report-title').value;
    const description = document.getElementById('report-description').value;
    const server_name = document.getElementById('report-server').value;

    try {
        const response = await fetch(`${API_URL}/reports`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ title, description, server_name })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Отчет успешно создан!', 'success');
            event.target.reset();
            loadReports();
        } else {
            showNotification(data.error || 'Ошибка создания отчета', 'error');
        }
    } catch (error) {
        showNotification('Ошибка подключения к серверу', 'error');
    }
}

// Загрузка отчетов
async function loadReports() {
    const reportsList = document.getElementById('reports-list');
    reportsList.innerHTML = '<p class="loading">Загрузка...</p>';

    try {
        const response = await fetch(`${API_URL}/reports`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (response.ok) {
            displayReports(data.reports);
        } else {
            reportsList.innerHTML = '<p class="loading">Ошибка загрузки отчетов</p>';
        }
    } catch (error) {
        reportsList.innerHTML = '<p class="loading">Ошибка подключения к серверу</p>';
    }
}

// Отображение отчетов
function displayReports(reports) {
    const reportsList = document.getElementById('reports-list');

    if (reports.length === 0) {
        reportsList.innerHTML = '<p class="loading">Отчетов пока нет</p>';
        return;
    }

    reportsList.innerHTML = reports.map(report => `
        <div class="report-item">
            <div class="report-header">
                <div class="report-title">${escapeHtml(report.title)}</div>
                <span class="report-status status-${report.status}">${getStatusText(report.status)}</span>
            </div>
            <div class="report-description">${escapeHtml(report.description)}</div>
            <div class="report-meta">
                ${report.server_name ? `<span>🖥️ Сервер: ${escapeHtml(report.server_name)}</span>` : ''}
                <span>👤 Автор: ${escapeHtml(report.author_username || 'Неизвестно')}</span>
                <span>📅 ${formatDate(report.created_at)}</span>
            </div>
            ${currentUser.id === report.user_id || currentUser.role === 'admin' ? `
                <div class="report-actions">
                    ${currentUser.role === 'admin' ? `
                        <select onchange="updateReportStatus(${report.id}, this.value)" class="form-group">
                            <option value="">Изменить статус...</option>
                            <option value="pending">Ожидает</option>
                            <option value="in_progress">В работе</option>
                            <option value="resolved">Решено</option>
                            <option value="closed">Закрыто</option>
                        </select>
                    ` : ''}
                    <button onclick="deleteReport(${report.id})" class="btn btn-danger">Удалить</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Обновление статуса отчета
async function updateReportStatus(reportId, status) {
    if (!status) return;

    try {
        const response = await fetch(`${API_URL}/reports/${reportId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ status })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Статус отчета обновлен', 'success');
            loadReports();
        } else {
            showNotification(data.error || 'Ошибка обновления статуса', 'error');
        }
    } catch (error) {
        showNotification('Ошибка подключения к серверу', 'error');
    }
}

// Удаление отчета
async function deleteReport(reportId) {
    if (!confirm('Вы уверены, что хотите удалить этот отчет?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/reports/${reportId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Отчет удален', 'success');
            loadReports();
        } else {
            showNotification(data.error || 'Ошибка удаления отчета', 'error');
        }
    } catch (error) {
        showNotification('Ошибка подключения к серверу', 'error');
    }
}

// Загрузка пользователей (для админа)
async function loadUsers() {
    const usersList = document.getElementById('users-list');
    usersList.innerHTML = '<p class="loading">Загрузка...</p>';

    try {
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (response.ok) {
            displayUsers(data.users);
        } else {
            usersList.innerHTML = `<p class="loading">${data.error || 'Ошибка загрузки пользователей'}</p>`;
        }
    } catch (error) {
        usersList.innerHTML = '<p class="loading">Ошибка подключения к серверу</p>';
    }
}

// Отображение пользователей
function displayUsers(users) {
    const usersList = document.getElementById('users-list');

    if (users.length === 0) {
        usersList.innerHTML = '<p class="loading">Пользователей нет</p>';
        return;
    }

    usersList.innerHTML = users.map(user => `
        <div class="user-item">
            <div class="user-info-item">
                <span class="user-name">${escapeHtml(user.username)}</span>
                <span class="user-email">${escapeHtml(user.email)}</span>
            </div>
            <div class="user-actions">
                <span class="user-role role-${user.role}">${user.role === 'admin' ? 'Администратор' : 'Пользователь'}</span>
                ${currentUser.id !== user.id ? `
                    <button onclick="changeUserRole(${user.id}, '${user.role === 'admin' ? 'user' : 'admin'}')" class="btn btn-success">
                        ${user.role === 'admin' ? '↓ Сделать пользователем' : '↑ Сделать админом'}
                    </button>
                    <button onclick="deleteUser(${user.id})" class="btn btn-danger">Удалить</button>
                ` : '<span style="color: #718096;">Это вы</span>'}
            </div>
        </div>
    `).join('');
}

// Изменение роли пользователя
async function changeUserRole(userId, newRole) {
    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ role: newRole })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Роль пользователя изменена', 'success');
            loadUsers();
        } else {
            showNotification(data.error || 'Ошибка изменения роли', 'error');
        }
    } catch (error) {
        showNotification('Ошибка подключения к серверу', 'error');
    }
}

// Удаление пользователя
async function deleteUser(userId) {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Пользователь удален', 'success');
            loadUsers();
        } else {
            showNotification(data.error || 'Ошибка удаления пользователя', 'error');
        }
    } catch (error) {
        showNotification('Ошибка подключения к серверу', 'error');
    }
}

// Показать секцию аутентификации
function showAuthSection() {
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('main-section').style.display = 'none';
    document.getElementById('user-info').style.display = 'none';
}

// Показать главную секцию
function showMainSection() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('main-section').style.display = 'block';
    document.getElementById('user-info').style.display = 'flex';
    document.getElementById('username-display').textContent = `👤 ${currentUser.username} (${currentUser.role === 'admin' ? 'Администратор' : 'Пользователь'})`;

    if (currentUser.role === 'admin') {
        document.getElementById('admin-section').style.display = 'block';
    }
}

// Показать уведомление
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Вспомогательные функции
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusText(status) {
    const statuses = {
        'pending': 'Ожидает',
        'in_progress': 'В работе',
        'resolved': 'Решено',
        'closed': 'Закрыто'
    };
    return statuses[status] || status;
}
