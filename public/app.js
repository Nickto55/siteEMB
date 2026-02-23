// API базовый URL
const API_URL = '/api';

// Глобальные переменные
let currentUser = null;
let authToken = null;
let currentRoute = '/';

// Маршруты и их контент
const routes = {
    '/': loadHomePage,
    '/rules': loadRulesPage,
    '/rules/mods': loadRulesMods,
    '/rules/concept': loadRulesConcept,
    '/rules/basics': loadRulesBasics,
    '/rules/punishments': loadRulesPunishments,
    '/rules/communication': loadRulesCommunication,
    '/rules/gameplay': loadRulesGameplay
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    handleRouting();

    // Обработка кнопок назад/вперед
    window.addEventListener('popstate', handleRouting);
});

// Навигация между страницами
function navigateTo(event, path) {
    if (event) event.preventDefault();
    window.history.pushState({ path }, '', path);
    handleRouting();
}

// Обработка маршрутов
function handleRouting() {
    const path = window.location.pathname;
    currentRoute = path;

    // Если не аутентифицирован и идет на не-публичный маршрут
    if (!authToken && path !== '/rules' && !path.startsWith('/rules/')) {
        loadAuthPage();
        return;
    }

    // Ищем маршрут
    const route = routes[path] || routes['/'];
    route();
}

// Проверка аутентификации
function checkAuth() {
    authToken = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');

    if (authToken && userData) {
        currentUser = JSON.parse(userData);
        updateUserInfo();
    }
}

// Обновление информации о пользователе в шапке
function updateUserInfo() {
    const userInfo = document.getElementById('user-info');
    const usernameDisplay = document.getElementById('username-display');

    if (currentUser) {
        usernameDisplay.textContent = `👤 ${currentUser.username}`;
        userInfo.style.display = 'flex';
    } else {
        userInfo.style.display = 'none';
    }
}

// ===== ЗАГРУЗКА СТРАНИЦ =====

// Страница аутентификации
function loadAuthPage() {
    const content = document.getElementById('app-content');
    content.innerHTML = `
        <div class="auth-container">
            <div class="auth-tabs">
                <button id="login-tab" class="tab-btn active" onclick="switchTab(event, 'login')">Вход</button>
                <button id="register-tab" class="tab-btn" onclick="switchTab(event, 'register')">Регистрация</button>
            </div>

            <div id="login-form" class="auth-form active">
                <h2>Вход в систему</h2>
                <form onsubmit="login(event)">
                    <div class="form-group">
                        <label>Имя пользователя:</label>
                        <input type="text" id="login-username" required>
                    </div>
                    <div class="form-group">
                        <label>Пароль:</label>
                        <input type="password" id="login-password" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Войти</button>
                </form>
            </div>

            <div id="register-form" class="auth-form">
                <h2>Регистрация</h2>
                <form onsubmit="register(event)">
                    <div class="form-group">
                        <label>Имя пользователя:</label>
                        <input type="text" id="register-username" required minlength="3">
                    </div>
                    <div class="form-group">
                        <label>Email:</label>
                        <input type="email" id="register-email" required>
                    </div>
                    <div class="form-group">
                        <label>Пароль:</label>
                        <input type="password" id="register-password" required minlength="6">
                    </div>
                    <button type="submit" class="btn btn-primary">Зарегистрироваться</button>
                </form>
            </div>
        </div>
    `;
}

// Главная страница (отчеты)
function loadHomePage() {
    const content = document.getElementById('app-content');

    if (!authToken) {
        loadAuthPage();
        return;
    }

    content.innerHTML = `
        <div class="card">
            <h2>Создать отчет</h2>
            <form onsubmit="createReport(event)">
                <div class="form-group">
                    <label>Название:</label>
                    <input type="text" id="report-title" required minlength="5">
                </div>
                <div class="form-group">
                    <label>Описание:</label>
                    <textarea id="report-description" required minlength="10" rows="4"></textarea>
                </div>
                <div class="form-group">
                    <label>Сервер (опционально):</label>
                    <input type="text" id="report-server">
                </div>
                <button type="submit" class="btn btn-primary">Создать отчет</button>
            </form>
        </div>

        <div class="card">
            <div class="card-header">
                <h2>Мои отчеты</h2>
                <button onclick="loadReports()" class="btn btn-secondary">🔄 Обновить</button>
            </div>
            <div id="reports-list" class="reports-list">
                <p class="loading">Загрузка...</p>
            </div>
        </div>

        <div id="admin-section" class="card" style="display: none;">
            <h2>👤 Управление пользователями (Администратор)</h2>
            <button onclick="loadUsers()" class="btn btn-secondary">Загрузить пользователей</button>
            <div id="users-list" class="users-list"></div>
        </div>
    `;

    loadReports();
    if (currentUser && currentUser.role === 'admin') {
        document.getElementById('admin-section').style.display = 'block';
    }
}

// Главная страница правил
function loadRulesPage() {
    const content = document.getElementById('app-content');
    content.innerHTML = `
        <h2>📚 Правила EmbroMine</h2>
        <p>Добро пожаловать в официальный раздел правил сервера EmbroMine! Здесь вы найдете полную информацию о том, как играть на нашем сервере, какие моды разрешены, правила общения и система наказаний.</p>
        
        <div class="rules-nav">
            <a href="/rules/mods" onclick="navigateTo(event, '/rules/mods')">📦 Моды</a>
            <a href="/rules/concept" onclick="navigateTo(event, '/rules/concept')">🎯 Концепция сезона</a>
            <a href="/rules/basics" onclick="navigateTo(event, '/rules/basics')">📋 Базовые принципы</a>
            <a href="/rules/punishments" onclick="navigateTo(event, '/rules/punishments')">⚖️ Наказания</a>
            <a href="/rules/communication" onclick="navigateTo(event, '/rules/communication')">💬 Общение</a>
            <a href="/rules/gameplay" onclick="navigateTo(event, '/rules/gameplay')">🎮 Игровые правила</a>
        </div>

        <h3>Основная информация</h3>
        <p>Все игроки на сервере обязаны соблюдать следующие правила. Нарушение правил может привести к предупреждениям, временным блокировкам или перманентному бану.</p>
        <p>Если у вас возникли вопросы по правилам, обратитесь к администрации сервера.</p>
    `;
}

// Функции загрузки правил
function loadRulesMods() {
    loadRulesTemplate('📦 Моды', `
        <h3>Список разрешенных и запрещенных модов</h3>
        <h3>✅ Разрешенные моды</h3>
        <ul>
            <li><strong>OptiFine</strong> - оптимизация производительности</li>
            <li><strong>Sodium</strong> - альтернативный видеоредактор</li>
            <li><strong>Litematica</strong> - помощник при строительстве</li>
            <li><strong>Minimap моды</strong> - Xaero's Minimap, WAWLA</li>
            <li><strong>Damage Indicators</strong> - отображение здоровья</li>
            <li><strong>JourneyMap</strong> - создание карты мира</li>
            <li><strong>Replay Mod</strong> - запись реплеев</li>
        </ul>
        <h3>❌ Запрещенные моды</h3>
        <ul>
            <li><strong>X-Ray</strong> - просмотр через блоки</li>
            <li><strong>Huzuni</strong> - хак-клиент с читами</li>
            <li><strong>Aimbot</strong> - автоушки в боях</li>
            <li><strong>Speedhack</strong> - увеличение скорости</li>
            <li><strong>NoFall</strong> - отключение урона от падения</li>
            <li><strong>Kill Aura</strong> - автоматические атаки</li>
            <li><strong>Fly Hack</strong> - полет без эндерперлов</li>
        </ul>
        <h3>⚠️ Важно</h3>
        <p>Использование запрещенных модов приведет к немедленному бану. Если вы не уверены, спросите администрацию.</p>
    `);
}

function loadRulesConcept() {
    loadRulesTemplate('🎯 Концепция сезона', `
        <h3>Концепция текущего сезона</h3>
        <p>Текущий сезон сервера EmbroMine предоставляет полную свободу в строительстве и выживании.</p>
        <h3>Основные цели</h3>
        <ul>
            <li>Создание собственной базы и развитие</li>
            <li>Добыча ресурсов и крафт</li>
            <li>Взаимодействие с игроками</li>
            <li>Участие в PvP и войнах кланов</li>
        </ul>
        <h3>Система кланов</h3>
        <ul>
            <li>Создавайте клан: /clan create</li>
            <li>Приглашайте друзей</li>
            <li>Защищайте территорию ClaimBlocks</li>
            <li>Участвуйте в войнах</li>
        </ul>
        <h3>Вознаграждения</h3>
        <ul>
            <li>💰 Валюта за квесты</li>
            <li>🏆 Титулы и значки</li>
            <li>📦 Специальные предметы</li>
            <li>⭐ Рейтинги</li>
        </ul>
        <p>Сезон длится <strong>6 месяцев</strong>.</p>
    `);
}

function loadRulesBasics() {
    loadRulesTemplate('📋 Базовые принципы', `
        <h3>Базовые принципы сервера</h3>
        <h3>Принцип 1: Уважение</h3>
        <p>Все игроки имеют право на уважение:</p>
        <ul>
            <li>Нет оскорблениям</li>
            <li>Нет преследованиям</li>
            <li>Нет дискриминации</li>
            <li>Нет спаму</li>
        </ul>
        <h3>Принцип 2: Честная игра</h3>
        <ul>
            <li>Запрещены читы</li>
            <li>Запрещена эксплуатация ошибок</li>
            <li>Запрещен дубинг</li>
        </ul>
        <h3>Принцип 3: Безопасность сервера</h3>
        <ul>
            <li>Нет лаг-машин</li>
            <li>Нет попыток обвала</li>
            <li>Оптимизация нужна всем</li>
        </ul>
    `);
}

function loadRulesPunishments() {
    loadRulesTemplate('⚖️ Система наказаний', `
        <h3>Уровни нарушений и наказания</h3>
        <h3>🟡 Легкие нарушения</h3>
        <ul>
            <li>Спам - мут на 30 мин</li>
            <li>Флуд - мут на 1-24 часа</li>
            <li>Мягкие оскорбления - предупреждение + мут</li>
        </ul>
        <h3>🟠 Средние нарушения</h3>
        <ul>
            <li>Грубые оскорбления - мут 24ч + предупр</li>
            <li>Попытка читов - бан 7 дней</li>
            <li>Кража - штраф + мут</li>
        </ul>
        <h3>🔴 Серьезные нарушения</h3>
        <ul>
            <li>Подтвержденные читы - перма-бан</li>
            <li>X-Ray - перма-бан</li>
            <li>Дубинг - бан 14 дней</li>
            <li>DDoS - перма-бан</li>
        </ul>
        <h3>Система предупреждений</h3>
        <ol>
            <li>Устное замечание</li>
            <li>Письменное предупреждение</li>
            <li>Мут на 24 часа</li>
            <li>Бан на 7 дней</li>
            <li>Перманентный бан</li>
        </ol>
    `);
}

function loadRulesCommunication() {
    loadRulesTemplate('💬 Правила общения', `
        <h3>Правила общения на сервере</h3>
        <h3>Основные принципы</h3>
        <ul>
            <li>✅ Будьте вежливы</li>
            <li>✅ Используйте русский язык</li>
            <li>✅ Помогайте новичкам</li>
            <li>✅ Аргументируйте спор</li>
        </ul>
        <h3>❌ Запрещено в чате</h3>
        <h4>Оскорбления и унижения</h4>
        <ul>
            <li>Личные оскорбления</li>
            <li>Мат и нецензурная брань</li>
            <li>Унижающие комментарии</li>
            <li>Издевательства</li>
        </ul>
        <h4>Спам и флуд</h4>
        <ul>
            <li>Повторяющиеся сообщения</li>
            <li>Множество сообщений подряд</li>
            <li>Капс (БОЛЬШИЕ БУКВЫ)</li>
            <li>Реклама другихсерверов</li>
        </ul>
        <h4>Дискриминация</h4>
        <ul>
            <li>По расе и национальности</li>
            <li>По полу и ориентации</li>
            <li>Религиозные оскорбления</li>
        </ul>
    `);
}

function loadRulesGameplay() {
    loadRulesTemplate('🎮 Игровые правила', `
        <h3>Правила геймплея</h3>
        <h3>Строительство и территория</h3>
        <h4>✅ Разрешено</h4>
        <ul>
            <li>Строить базу везде (кроме спавна)</li>
            <li>Создавать шахты и фермы</li>
            <li>Протектить территорию ClaimBlocks</li>
            <li>Использовать редстоун</li>
        </ul>
        <h4>❌ Запрещено</h4>
        <ul>
            <li>Строить < 100 блоков от другой базы</li>
            <li>Лаг-машины</li>
            <li>Занимать огромные территории</li>
            <li>Копировать проекты</li>
        </ul>
        <h3>PvP и войны</h3>
        <h4>✅ Разрешено</h4>
        <ul>
            <li>Войны между кланами</li>
            <li>Рейд врагов на войне</li>
            <li>Турниры</li>
        </ul>
        <h4>❌ Запрещено</h4>
        <ul>
            <li>Убийство без причины</li>
            <li>Рейд мирных</li>
            <li>Убийство новичков</li>
            <li>Использование читов</li>
        </ul>
        <h3>Экономика</h3>
        <ul>
            <li>Валюта: Coins (Монеты)</li>
            <li>Получение: квесты, рейды, достижения</li>
            <li>Максимум: 10,000,000 монет</li>
        </ul>
    `);
}

// Шаблон для страниц правил
function loadRulesTemplate(title, content) {
    const appContent = document.getElementById('app-content');
    appContent.innerHTML = `
        <h2>${title}</h2>
        <div class="rules-nav">
            <a href="/rules" onclick="navigateTo(event, '/rules')">← Все правила</a>
        </div>
        ${content}
    `;
}

// ===== ФУНКЦИИ АУТЕНТИФИКАЦИИ =====

function switchTab(event, tab) {
    event.preventDefault();
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (tab === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    } else {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    }
}

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
            switchTab(event, 'login');
            document.getElementById('login-username').value = username;
            event.target.reset();
        } else {
            showNotification(data.error || 'Ошибка регистрации', 'error');
        }
    } catch (error) {
        showNotification('Ошибка подключения к серверу', 'error');
    }
}

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

            updateUserInfo();
            showNotification(`Добро пожаловать, ${currentUser.username}!`, 'success');
            navigateTo(null, '/');
        } else {
            showNotification(data.error || 'Ошибка входа', 'error');
        }
    } catch (error) {
        showNotification('Ошибка подключения к серверу', 'error');
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    updateUserInfo();
    navigateTo(null, '/');
}

// ===== ФУНКЦИИ ОТЧЕТОВ =====

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

async function loadReports() {
    const reportsList = document.getElementById('reports-list');
    if (!reportsList) return;

    reportsList.innerHTML = '<p class="loading">Загрузка...</p>';

    try {
        const response = await fetch(`${API_URL}/reports`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (response.ok) {
            displayReports(data.reports);
        } else {
            reportsList.innerHTML = `<p class="loading">Ошибка загрузки отчетов</p>`;
        }
    } catch (error) {
        reportsList.innerHTML = `<p class="loading">Ошибка подключения</p>`;
    }
}

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
                ${report.server_name ? `<span>:🖥️ Сервер: ${escapeHtml(report.server_name)}</span>` : ''}
                <span>👤 Автор: ${escapeHtml(report.author_username || 'Неизвестно')}</span>
                <span>📅 ${formatDate(report.created_at)}</span>
            </div>
            ${currentUser.id === report.user_id || currentUser.role === 'admin' ? `
                <div class="report-actions">
                    ${currentUser.role === 'admin' ? `
                        <select onchange="updateReportStatus(${report.id}, this.value)">
                            <option value="">Статус...</option>
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

        if (response.ok) {
            showNotification('Статус обновлен', 'success');
            loadReports();
        } else {
            showNotification('Ошибка обновления', 'error');
        }
    } catch (error) {
        showNotification('Ошибка подключения', 'error');
    }
}

async function deleteReport(reportId) {
    if (!confirm('Вы уверены?')) return;

    try {
        const response = await fetch(`${API_URL}/reports/${reportId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            showNotification('Отчет удален', 'success');
            loadReports();
        } else {
            showNotification('Ошибка удаления', 'error');
        }
    } catch (error) {
        showNotification('Ошибка подключения', 'error');
    }
}

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
            usersList.innerHTML = `<p class="loading">Ошибка загрузки</p>`;
        }
    } catch (error) {
        usersList.innerHTML = `<p class="loading">Ошибка подключения</p>`;
    }
}

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
                <span class="user-role role-${user.role}">${user.role === 'admin' ? 'Админ' : 'Пользователь'}</span>
                ${currentUser.id !== user.id ? `
                    <button onclick="changeUserRole(${user.id}, '${user.role === 'admin' ? 'user' : 'admin'}')" class="btn btn-success">
                        ${user.role === 'admin' ? 'Юзер' : 'Админ'}
                    </button>
                    <button onclick="deleteUser(${user.id})" class="btn btn-danger">Удалить</button>
                ` : '<span>Это вы</span>'}
            </div>
        </div>
    `).join('');
}

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

        if (response.ok) {
            showNotification('Роль изменена', 'success');
            loadUsers();
        } else {
            showNotification('Ошибка', 'error');
        }
    } catch (error) {
        showNotification('Ошибка подключения', 'error');
    }
}

async function deleteUser(userId) {
    if (!confirm('Удалить пользователя?')) return;

    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            showNotification('Пользователь удален', 'success');
            loadUsers();
        } else {
            showNotification('Ошибка', 'error');
        }
    } catch (error) {
        showNotification('Ошибка подключения', 'error');
    }
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

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
