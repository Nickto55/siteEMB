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

    // Observe all cards and sections
    document.querySelectorAll('.group').forEach(el => {
        el.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-10');
        observer.observe(el);
    });
}

// Smooth scroll for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close mobile menu if open
                const menu = document.getElementById('mobile-menu');
                if (menu) menu.classList.add('hidden');
            }
        });
    });
}

// Authentication handler
async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const username = form.querySelector('[name="username"]').value;
    const password = form.querySelector('[name="password"]').value;

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
            showToast('Вход выполнен успешно!');
            setTimeout(() => window.location.href = 'dashboard.html', 1000);
        } else {
            showToast(data.error || 'Ошибка входа');
        }
    } catch (error) {
        showToast('Ошибка подключения');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const form = event.target;
    const username = form.querySelector('[name="username"]').value;
    const email = form.querySelector('[name="email"]').value;
    const password = form.querySelector('[name="password"]').value;
    const passwordConfirm = form.querySelector('[name="password_confirm"]').value;

    if (password !== passwordConfirm) {
        showToast('Пароли не совпадают!');
        return;
    }

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Регистрация успешна!');
            form.reset();
        } else {
            showToast(data.error || 'Ошибка регистрации');
        }
    } catch (error) {
        showToast('Ошибка подключения');
    }
}

function switchTab(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabs = document.querySelectorAll('.tab-btn');

    if (tab === 'login') {
        loginForm?.classList.remove('hidden');
        registerForm?.classList.add('hidden');
        tabs[0]?.classList.add('active');
        tabs[1]?.classList.remove('active');
    } else {
        loginForm?.classList.add('hidden');
        registerForm?.classList.remove('hidden');
        tabs[0]?.classList.remove('active');
        tabs[1]?.classList.add('active');
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

function loadUserData() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        window.location.href = 'login.html';
        return;
    }

    const userData = JSON.parse(user);
    const profileUsername = document.getElementById('profile-username');
    const profileEmail = document.getElementById('profile-email');

    if (profileUsername) profileUsername.textContent = userData.username;
    if (profileEmail) profileEmail.textContent = userData.email;
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
    createParticles();
    initScrollAnimations();
    initSmoothScroll();
    checkAuthStatus();
    initDropdownMenu();

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
