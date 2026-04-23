// Ensure favicon is set for all pages
function setFavicon() {
    const head = document.head;
    if (!head) return;

    const existing = head.querySelector('link[rel="icon"]');
    const href = '/static/photo_2026-03-01_23-30-45.jpg';

    if (existing) {
        existing.type = 'image/jpeg';
        existing.href = href;
        return;
    }

    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/jpeg';
    link.href = href;
    head.appendChild(link);
}

// Initialize particles
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'absolute w-1 h-1 bg-purple-royal/20 rounded-full pointer-events-none';

        // Random positioning and animation
        const left = Math.random() * 100;
        const delay = Math.random() * 20;
        const duration = 15 + Math.random() * 20;
        const size = 2 + Math.random() * 4;

        particle.style.left = `${left}%`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.animation = `float-up ${duration}s linear ${delay}s infinite`;
        particle.style.opacity = Math.random() * 0.5 + 0.1;

        container.appendChild(particle);
    }
}

// Mobile menu toggle
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.classList.toggle('hidden');
}

// Mobile submenu toggle
function toggleMobileSubmenu(submenuId, arrowId) {
    const submenu = document.getElementById(submenuId);
    const arrow = document.getElementById(arrowId);
    if (submenu) {
        submenu.classList.toggle('hidden');
        if (arrow) {
            arrow.textContent = submenu.classList.contains('hidden') ? '▶' : '▼';
        }
    }
}

// Rules mobile menu toggle
function toggleRulesMobileMenu() {
    const rulesMenu = document.getElementById('rules-mobile-menu');
    const arrow = document.getElementById('rules-mobile-arrow');
    if (rulesMenu) {
        rulesMenu.classList.toggle('hidden');
        if (arrow) {
            arrow.textContent = rulesMenu.classList.contains('hidden') ? '▶' : '▼';
        }
    }
}

// Navigation mobile menu toggle
function toggleMobileNavMenu() {
    const navMenu = document.getElementById('nav-mobile-menu');
    const arrow = document.getElementById('nav-mobile-arrow');
    if (navMenu) {
        navMenu.classList.toggle('hidden');
        if (arrow) {
            arrow.textContent = navMenu.classList.contains('hidden') ? '▶' : '▼';
        }
    }
}

// Copy IP to clipboard
function copyIP() {
    const ip = 'play.embromine.ru';
    navigator.clipboard.writeText(ip).then(() => {
        showToast('IP скопирован!');

        // Add click animation to button
        const buttons = document.querySelectorAll('button[onclick="copyIP()"]');
        buttons.forEach(btn => {
            btn.classList.add('scale-95');
            setTimeout(() => btn.classList.remove('scale-95'), 150);
        });
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = ip;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('IP скопирован!');
    });
}

// Show toast notification
function showToast(message) {
    // Check if toast already exists
    let toast = document.getElementById('global-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'global-toast';
        toast.className = 'fixed top-24 left-1/2 transform -translate-x-1/2 bg-[#6D28D9] text-white px-6 py-3 rounded-lg shadow-2xl z-50 transition-all duration-300 opacity-0 translate-y-[-20px] font-medium flex items-center gap-2';
        document.body.appendChild(toast);
    }

    toast.innerHTML = `<span>✓</span> ${message}`;

    // Show
    setTimeout(() => {
        toast.classList.remove('opacity-0', 'translate-y-[-20px]');
    }, 10);

    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-[-20px]');
    }, 3000);
}

// Simulate live player count updates
function updatePlayerCount() {
    const countElement = document.getElementById('player-count');
    if (!countElement) return;

    // Simulate realistic fluctuations
    const current = parseInt(countElement.textContent);
    const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
    const newCount = Math.max(0, Math.min(100, current + change));

    // Animate number change
    if (newCount !== current) {
        countElement.style.transform = 'scale(1.2)';
        countElement.style.color = newCount > current ? '#A855F7' : '#B02E26';

        setTimeout(() => {
            countElement.textContent = newCount;
            countElement.style.transform = 'scale(1)';
            countElement.style.color = '';
        }, 200);
    }
}

// Update ping randomly
function updatePing() {
    const pingElement = document.getElementById('ping');
    if (!pingElement) return;

    const ping = Math.floor(Math.random() * 20) + 8; // 8-28ms
    pingElement.textContent = `${ping} ms`;
}

// Navbar scroll effect
function handleScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    if (window.scrollY > 50) {
        navbar.classList.add('shadow-lg', 'bg-[#0a0810]/95');
        navbar.classList.remove('bg-[#0a0810]/80');
    } else {
        navbar.classList.remove('shadow-lg', 'bg-[#0a0810]/95');
        navbar.classList.add('bg-[#0a0810]/80');
    }
}

// Intersection Observer for animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('opacity-100', 'translate-y-0');
                entry.target.classList.remove('opacity-0', 'translate-y-10');
            }
        });
    }, observerOptions);

    // Observe elements explicitly marked with .animate-on-scroll
    // Also handle legacy .group elements that already have opacity-0 translate-y-10 inline
    // (was breaking all .group elements by forcing them invisible)
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        el.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-10');
        observer.observe(el);
    });

    document.querySelectorAll('.group').forEach(el => {
        if (el.classList.contains('opacity-0') && el.classList.contains('translate-y-10')) {
            el.classList.add('transition-all', 'duration-700');
            observer.observe(el);
        }
    });
}

// Smooth scroll for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const href = this.getAttribute('href');

            if (href === '#') {
                // Scroll to top
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            } else {
                // Scroll to element
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }

            // Close mobile menu if open
            const menu = document.getElementById('mobile-menu');
            if (menu) menu.classList.add('hidden');
        });
    });
}

// Form validation helpers
function setFormMessage(containerId, message, type = 'error') {
    const container = document.getElementById(containerId);
    if (!container) return;
    const colorClass = type === 'error' ? 'text-red-400' : (type === 'success' ? 'text-green-400' : 'text-purple-soft');
    container.innerHTML = `<p class="${colorClass} text-sm text-center">${message}</p>`;
}

function setButtonLoading(btn, isLoading, originalText) {
    if (isLoading) {
        btn.disabled = true;
        btn.dataset.originalText = originalText || btn.textContent;
        btn.innerHTML = '<span class="inline-flex items-center gap-2"><svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Загрузка...</span>';
        btn.classList.add('opacity-75', 'cursor-not-allowed');
    } else {
        btn.disabled = false;
        btn.textContent = btn.dataset.originalText || originalText;
        btn.classList.remove('opacity-75', 'cursor-not-allowed');
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Authentication handler
async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const username = form.querySelector('[name="username"]').value.trim();
    const password = form.querySelector('[name="password"]').value;
    const submitBtn = form.querySelector('button[type="submit"]');

    // Validation
    if (!username || !password) {
        setFormMessage('login-message', 'Введите имя пользователя и пароль');
        return;
    }

    setFormMessage('login-message', '');
    setButtonLoading(submitBtn, true);

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setFormMessage('login-message', 'Вход выполнен успешно! Перенаправление...', 'success');
            showToast('Вход выполнен успешно!');
            setTimeout(() => {
                const redirect = new URLSearchParams(window.location.search).get('redirect');
                window.location.href = redirect || 'dashboard.html';
            }, 800);
        } else {
            setFormMessage('login-message', data.error || 'Неверные учетные данные');
        }
    } catch (error) {
        setFormMessage('login-message', 'Ошибка подключения к серверу');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const form = event.target;
    const username = form.querySelector('[name="username"]').value.trim();
    const email = form.querySelector('[name="email"]').value.trim();
    const password = form.querySelector('[name="password"]').value;
    const passwordConfirm = form.querySelector('[name="password_confirm"]').value;
    const submitBtn = form.querySelector('button[type="submit"]');

    // Frontend validation
    if (!username || !email || !password || !passwordConfirm) {
        setFormMessage('register-message', 'Все поля обязательны');
        return;
    }

    if (username.length < 3) {
        setFormMessage('register-message', 'Имя пользователя должно быть минимум 3 символа');
        return;
    }

    if (!isValidEmail(email)) {
        setFormMessage('register-message', 'Введите корректный email');
        return;
    }

    if (password.length < 6) {
        setFormMessage('register-message', 'Пароль должен быть минимум 6 символов');
        return;
    }

    if (password !== passwordConfirm) {
        setFormMessage('register-message', 'Пароли не совпадают');
        return;
    }

    setFormMessage('register-message', '');
    setButtonLoading(submitBtn, true);

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            setFormMessage('register-message', 'Регистрация успешна! Теперь вы можете войти.', 'success');
            showToast('Регистрация успешна!');
            form.reset();
            // Switch to login tab after a short delay
            setTimeout(() => switchTab('login'), 1200);
        } else {
            setFormMessage('register-message', data.error || 'Ошибка регистрации');
        }
    } catch (error) {
        setFormMessage('register-message', 'Ошибка подключения к серверу');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

function switchTab(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabs = document.querySelectorAll('.tab-btn');

    if (tab === 'login') {
        if (loginForm) {
            loginForm.style.display = 'block';
        }
        if (registerForm) {
            registerForm.style.display = 'none';
        }
        if (tabs[0]) {
            tabs[0].classList.add('active');
        }
        if (tabs[1]) {
            tabs[1].classList.remove('active');
        }
    } else {
        if (loginForm) {
            loginForm.style.display = 'none';
        }
        if (registerForm) {
            registerForm.style.display = 'block';
        }
        if (tabs[0]) {
            tabs[0].classList.remove('active');
        }
        if (tabs[1]) {
            tabs[1].classList.add('active');
        }
    }
}

function handleLogout() {
    if (confirm('Вы действительно хотите выйти?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}

function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const loginLink = document.getElementById('login-link');
    const dashboardLink = document.getElementById('dashboard-link');
    const logoutBtn = document.getElementById('logout-btn');
    const userInfo = document.getElementById('user-info');

    if (token && localStorage.getItem('user')) {
        const user = JSON.parse(localStorage.getItem('user'));

        if (loginLink) loginLink.style.display = 'none';
        if (dashboardLink) dashboardLink.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (userInfo) userInfo.textContent = `Привет, ${user.username}!`;
    }
}

function requireAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (!token || !user) {
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname.split('/').pop());
        return false;
    }
    return true;
}

function requireAdmin() {
    if (!requireAuth()) return false;
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user.role !== 'admin') {
            window.location.href = 'dashboard.html';
            return false;
        }
        return true;
    } catch (e) {
        window.location.href = 'login.html';
        return false;
    }
}

async function loadUserData() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // Загружаем свежие данные пользователя с сервера
        const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            // Обновляем localStorage свежими данными
            localStorage.setItem('user', JSON.stringify(data.user));
        } else if (response.status === 401) {
            // Токен истек или недействителен
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            return;
        }
    } catch (error) {
        console.error('Ошибка загрузки данных пользователя:', error);
    }

    // Теперь используем данные из localStorage (обновленные или старые)
    const userData = JSON.parse(localStorage.getItem('user'));
    const profileUsername = document.getElementById('profile-username');
    const profileEmail = document.getElementById('profile-email');
    const profileAvatar = document.getElementById('profile-avatar');
    const profileAvatarPlaceholder = document.getElementById('profile-avatar-placeholder');
    const profileBio = document.getElementById('profile-bio');
    const profileRole = document.getElementById('profile-role');
    const profileCreatedAt = document.getElementById('profile-created-at');

    if (profileUsername) profileUsername.textContent = userData.username;
    if (profileEmail) profileEmail.textContent = userData.email;
    if (profileBio) profileBio.textContent = userData.bio || 'Не указано';
    if (profileRole) profileRole.textContent = getRoleName(userData.role);
    if (profileCreatedAt && userData.created_at) profileCreatedAt.textContent = formatDate(userData.created_at);

    // Handle avatar display
    if (profileAvatar && profileAvatarPlaceholder) {
        if (userData.avatar_url) {
            profileAvatar.src = userData.avatar_url;
            profileAvatar.style.display = 'block';
            profileAvatarPlaceholder.style.display = 'none';
        } else {
            profileAvatar.style.display = 'none';
            profileAvatarPlaceholder.style.display = 'flex';
            // Show first letter of username
            profileAvatarPlaceholder.textContent = userData.username ? userData.username.charAt(0).toUpperCase() : '?';
        }
    }

    // Show admin section if user is admin
    const adminSection = document.getElementById('admin-section');
    if (adminSection && userData.role === 'admin') {
        adminSection.style.display = 'block';
    }
}

function getRoleName(role) {
    const roles = {
        'user': 'Пользователь',
        'moderator': 'Модератор',
        'admin': 'Администратор'
    };
    return roles[role] || role;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

async function updateProfile(event) {
    event.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Ошибка авторизации');
        return;
    }

    const email = document.getElementById('edit-email')?.value;
    const avatarUrl = document.getElementById('edit-avatar')?.value;
    const bio = document.getElementById('edit-bio')?.value;

    try {
        const response = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email, avatar_url: avatarUrl, bio })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Профиль успешно обновлен');
            // Обновляем данные в localStorage
            const updatedUser = { ...JSON.parse(localStorage.getItem('user')), ...data.user };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            // Перезагружаем страницу для отображения изменений
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showToast(data.error || 'Ошибка обновления профиля');
        }
    } catch (error) {
        showToast('Ошибка подключения');
    }
}

async function changePassword(event) {
    event.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Ошибка авторизации');
        return;
    }

    const currentPassword = document.getElementById('current-password')?.value;
    const newPassword = document.getElementById('new-password')?.value;
    const confirmNewPassword = document.getElementById('confirm-new-password')?.value;

    if (newPassword !== confirmNewPassword) {
        showToast('Новый пароль и подтверждение не совпадают');
        return;
    }

    try {
        const response = await fetch('/api/auth/change-password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Пароль успешно изменен');
            // Очищаем форму
            event.target.reset();
        } else {
            showToast(data.error || 'Ошибка изменения пароля');
        }
    } catch (error) {
        showToast('Ошибка подключения');
    }
}

function toggleEditMode() {
    const editForm = document.getElementById('edit-profile-form');
    const viewMode = document.getElementById('profile-view-mode');

    if (editForm && viewMode) {
        const isHidden = editForm.classList.contains('hidden');
        if (isHidden) {
            // Заполняем форму текущими данными
            const user = JSON.parse(localStorage.getItem('user'));
            if (document.getElementById('edit-email')) document.getElementById('edit-email').value = user.email;
            if (document.getElementById('edit-avatar')) document.getElementById('edit-avatar').value = user.avatar_url || '';
            if (document.getElementById('edit-bio')) document.getElementById('edit-bio').value = user.bio || '';

            editForm.classList.remove('hidden');
            viewMode.classList.add('hidden');
        } else {
            editForm.classList.add('hidden');
            viewMode.classList.remove('hidden');
        }
    }
}

// Dropdown menu handler
function initDropdownMenu() {
    const dropdowns = document.querySelectorAll('.nav-dropdown');

    dropdowns.forEach(dropdown => {
        const trigger = dropdown.querySelector('.nav-link');
        const menu = dropdown.querySelector('.dropdown-menu');

        if (!trigger || !menu) return;

        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            // Close other dropdowns
            dropdowns.forEach(d => {
                if (d !== dropdown) {
                    d.classList.remove('active');
                }
            });
            dropdown.classList.toggle('active');
        });

        // Close dropdown when clicking on a link inside
        menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                dropdown.classList.remove('active');
            });
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-dropdown')) {
            dropdowns.forEach(d => d.classList.remove('active'));
        }
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setFavicon();
    createParticles();
    initScrollAnimations();
    initSmoothScroll();
    checkAuthStatus();
    initDropdownMenu();

    // Initialize login tabs if on login page
    if (document.getElementById('login-form') && document.getElementById('register-form')) {
        switchTab('login'); // Default to login tab
    }

    // Update stats every 5 seconds
    setInterval(updatePlayerCount, 5000);
    setInterval(updatePing, 3000);

    // Scroll listener
    window.addEventListener('scroll', handleScroll);

    // Load user data if on protected page
    if (document.body.id === 'dashboard' || document.body.id === 'admin-panel') {
        loadUserData();
    }
});

// Handle window resize
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        // Close mobile menu on resize to desktop
        if (window.innerWidth >= 1024) {
            const menu = document.getElementById('mobile-menu');
            if (menu) menu.classList.add('hidden');
        }
    }, 250);
});
