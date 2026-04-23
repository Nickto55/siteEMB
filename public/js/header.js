document.addEventListener('DOMContentLoaded', () => {
    renderHeader();
});

function renderHeader() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    const headerHTML = `
    <nav class="fixed w-full z-50 bg-void-black/80 backdrop-blur-md border-b border-magenta-glow/10 transition-all duration-300" id="navbar">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <!-- Logo -->
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-purple-deep via-magenta-glow to-purple-neon rounded-lg flex items-center justify-center shadow-lg shadow-magenta-glow/25">
                        <span class="text-white text-lg font-bold">E</span>
                    </div>
                    <a href="index.html" class="text-white font-bold tracking-tight hover:text-purple-soft transition-colors">
                        Embro<span class="text-magenta-glow">Mine</span>
                    </a>
                </div>

                <!-- Desktop Navigation -->
                <div class="hidden lg:block">
                    <div class="ml-10 flex items-baseline space-x-1">
                        <a href="index.html" class="nav-link ${currentPage === 'index.html' || currentPage === '' ? 'text-purple-soft bg-purple-deep/20' : 'text-purple-soft/70 hover:text-purple-soft hover:bg-purple-deep/10'} px-3 py-2 rounded-md text-sm font-medium transition-all">Главная</a>
                        
                        <div class="relative group inline-block">
                            <button class="nav-link text-purple-soft/70 hover:text-purple-soft hover:bg-purple-deep/10 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-all">
                                О сервере <span class="ml-1 text-xs transition-transform group-hover:rotate-180">▼</span>
                            </button>
                            <div class="absolute left-0 mt-0 w-56 bg-void-dark rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 border border-purple-deep/30">
                                <a href="description.html" class="block px-4 py-2 text-sm text-purple-soft/70 hover:text-purple-soft hover:bg-purple-royal/10 rounded-t-lg">Описание</a>
                                <a href="mechanics.html" class="block px-4 py-2 text-sm text-purple-soft/70 hover:text-purple-soft hover:bg-purple-neon/10">Механики</a>
                                <a href="season-concept.html" class="block px-4 py-2 text-sm text-purple-soft/70 hover:text-purple-soft hover:bg-purple-neon/10 rounded-b-lg">Концепция сезона</a>
                            </div>
                        </div>

                        <div class="relative group inline-block">
                            <button class="nav-link text-purple-soft/70 hover:text-purple-soft hover:bg-purple-deep/10 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-all">
                                Правила <span class="ml-1 text-xs transition-transform group-hover:rotate-180">▼</span>
                            </button>
                            <div class="absolute left-0 mt-0 w-56 bg-void-dark rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 border border-purple-deep/30">
                                <a href="rules.html" class="block px-4 py-2 text-sm text-purple-soft/70 hover:text-purple-soft hover:bg-purple-royal/10 rounded-t-lg">Общие правила</a>
                                <a href="rp-rules.html" class="block px-4 py-2 text-sm text-purple-soft/70 hover:text-purple-soft hover:bg-purple-neon/10">Правила РП</a>
                                <a href="game-rules.html" class="block px-4 py-2 text-sm text-purple-soft/70 hover:text-purple-soft hover:bg-purple-neon/10">Игровые правила</a>
                                <a href="chat-rules.html" class="block px-4 py-2 text-sm text-purple-soft/70 hover:text-purple-soft hover:bg-purple-neon/10">Правила чата</a>
                                <a href="banned-mods.html" class="block px-4 py-2 text-sm text-purple-soft/70 hover:text-purple-soft hover:bg-purple-neon/10 rounded-b-lg">Запрещённые моды</a>
                            </div>
                        </div>

                        <a href="guides.html" class="nav-link ${currentPage === 'guides.html' ? 'text-purple-soft bg-purple-deep/20' : 'text-purple-soft/70 hover:text-purple-soft hover:bg-purple-deep/10'} px-3 py-2 rounded-md text-sm font-medium transition-all">Гайды</a>
                        <a href="map.html" class="nav-link ${currentPage === 'map.html' ? 'text-purple-soft bg-purple-deep/20' : 'text-purple-soft/70 hover:text-purple-soft hover:bg-purple-deep/10'} px-3 py-2 rounded-md text-sm font-medium transition-all">Карта</a>
                        <a href="support.html" class="nav-link ${currentPage === 'support.html' ? 'text-purple-soft bg-purple-deep/20' : 'text-purple-soft/70 hover:text-purple-soft hover:bg-purple-deep/10'} px-3 py-2 rounded-md text-sm font-medium transition-all">Поддержка</a>

                        <div id="auth-zone" class="inline-block ml-2 pl-2 border-l border-purple-soft/10">
                        </div>
                    </div>
                </div>

                <!-- Mobile menu button -->
                <div class="lg:hidden">
                    <button onclick="toggleMobileHeaderMenu()" class="text-purple-soft hover:text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-deep">
                        <svg id="mobile-menu-icon" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- Mobile Navigation -->
        <div id="mobile-menu" class="hidden lg:hidden bg-void-black/95 backdrop-blur-xl border-t border-purple-soft/10">
            <div class="px-4 pt-2 pb-4 space-y-1">
                <a href="index.html" class="block px-3 py-2 rounded-md text-base font-medium ${currentPage === 'index.html' || currentPage === '' ? 'text-purple-soft bg-purple-deep/20' : 'text-purple-soft/70 hover:text-purple-soft hover:bg-purple-deep/10'}">Главная</a>
                
                <button onclick="toggleMobileSubmenu('mobile-about-submenu', 'mobile-about-arrow')" class="w-full text-left px-3 py-2 rounded-md text-base font-medium text-purple-soft/70 hover:text-purple-soft hover:bg-purple-deep/10 flex items-center justify-between">
                    О сервере <span id="mobile-about-arrow" class="text-xs">▶</span>
                </button>
                <div id="mobile-about-submenu" class="hidden pl-4 space-y-1">
                    <a href="description.html" class="block px-3 py-2 rounded-md text-sm text-purple-soft/60 hover:text-purple-soft hover:bg-purple-deep/10">Описание</a>
                    <a href="mechanics.html" class="block px-3 py-2 rounded-md text-sm text-purple-soft/60 hover:text-purple-soft hover:bg-purple-deep/10">Механики</a>
                    <a href="season-concept.html" class="block px-3 py-2 rounded-md text-sm text-purple-soft/60 hover:text-purple-soft hover:bg-purple-deep/10">Концепция сезона</a>
                </div>

                <button onclick="toggleMobileSubmenu('mobile-rules-submenu', 'mobile-rules-arrow')" class="w-full text-left px-3 py-2 rounded-md text-base font-medium text-purple-soft/70 hover:text-purple-soft hover:bg-purple-deep/10 flex items-center justify-between">
                    Правила <span id="mobile-rules-arrow" class="text-xs">▶</span>
                </button>
                <div id="mobile-rules-submenu" class="hidden pl-4 space-y-1">
                    <a href="rules.html" class="block px-3 py-2 rounded-md text-sm text-purple-soft/60 hover:text-purple-soft hover:bg-purple-deep/10">Общие правила</a>
                    <a href="rp-rules.html" class="block px-3 py-2 rounded-md text-sm text-purple-soft/60 hover:text-purple-soft hover:bg-purple-deep/10">Правила РП</a>
                    <a href="game-rules.html" class="block px-3 py-2 rounded-md text-sm text-purple-soft/60 hover:text-purple-soft hover:bg-purple-deep/10">Игровые правила</a>
                    <a href="chat-rules.html" class="block px-3 py-2 rounded-md text-sm text-purple-soft/60 hover:text-purple-soft hover:bg-purple-deep/10">Правила чата</a>
                    <a href="banned-mods.html" class="block px-3 py-2 rounded-md text-sm text-purple-soft/60 hover:text-purple-soft hover:bg-purple-deep/10">Запрещённые моды</a>
                </div>

                <a href="guides.html" class="block px-3 py-2 rounded-md text-base font-medium ${currentPage === 'guides.html' ? 'text-purple-soft bg-purple-deep/20' : 'text-purple-soft/70 hover:text-purple-soft hover:bg-purple-deep/10'}">Гайды</a>
                <a href="map.html" class="block px-3 py-2 rounded-md text-base font-medium ${currentPage === 'map.html' ? 'text-purple-soft bg-purple-deep/20' : 'text-purple-soft/70 hover:text-purple-soft hover:bg-purple-deep/10'}">Карта</a>
                <a href="support.html" class="block px-3 py-2 rounded-md text-base font-medium ${currentPage === 'support.html' ? 'text-purple-soft bg-purple-deep/20' : 'text-purple-soft/70 hover:text-purple-soft hover:bg-purple-deep/10'}">Поддержка</a>

                <div id="mobile-auth-zone" class="pt-2 mt-2 border-t border-purple-soft/10">
                </div>
            </div>
        </div>
    </nav>
    `;

    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    checkAuth();
}

function checkAuth() {
    const authZone = document.getElementById('auth-zone');
    const mobileAuthZone = document.getElementById('mobile-auth-zone');
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    let username = '';
    try {
        if (user) username = JSON.parse(user).username || '';
    } catch (e) { }

    const isDashboard = window.location.pathname.includes('dashboard.html');
    const isAdminPanel = window.location.pathname.includes('admin-panel.html');

    if (token) {
        const desktopHTML = `
            <a href="dashboard.html" class="${isDashboard ? 'text-magenta-glow' : 'text-purple-soft hover:text-magenta-glow'} px-3 py-2 rounded-md text-sm font-medium transition-colors">
                ${username ? '👤 ' + username : 'Личный кабинет'}
            </a>
            <button onclick="logout()" class="ml-2 text-red-400 hover:text-red-300 text-sm font-medium px-3 py-2 rounded-md hover:bg-red-400/10 transition-all">
                Выход
            </button>
        `;
        const mobileHTML = `
            <a href="dashboard.html" class="block px-3 py-2 rounded-md text-base font-medium ${isDashboard ? 'text-magenta-glow bg-purple-deep/20' : 'text-purple-soft hover:text-magenta-glow hover:bg-purple-deep/10'}">
                ${username ? '👤 ' + username : 'Личный кабинет'}
            </a>
            <button onclick="logout()" class="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all">
                🚪 Выход
            </button>
        `;
        if (authZone) authZone.innerHTML = desktopHTML;
        if (mobileAuthZone) mobileAuthZone.innerHTML = mobileHTML;
    } else {
        const desktopHTML = `
            <a href="login.html" class="text-purple-soft hover:text-white transition-colors px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-deep/10">Вход</a>
        `;
        const mobileHTML = `
            <a href="login.html" class="block px-3 py-2 rounded-md text-base font-medium text-purple-soft hover:text-white hover:bg-purple-deep/10">Вход</a>
        `;
        if (authZone) authZone.innerHTML = desktopHTML;
        if (mobileAuthZone) mobileAuthZone.innerHTML = mobileHTML;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

function toggleMobileHeaderMenu() {
    const menu = document.getElementById('mobile-menu');
    const icon = document.getElementById('mobile-menu-icon');
    if (!menu) return;
    
    const isHidden = menu.classList.contains('hidden');
    if (isHidden) {
        menu.classList.remove('hidden');
        if (icon) {
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>';
        }
    } else {
        menu.classList.add('hidden');
        if (icon) {
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>';
        }
    }
}

// toggleMobileSubmenu is defined in script.js
