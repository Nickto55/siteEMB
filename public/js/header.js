document.addEventListener('DOMContentLoaded', () => {
    renderHeader();
});

function renderHeader() {
    const headerHTML = `
    <nav class="fixed w-full z-50 bg-void-black/80 backdrop-blur-md border-b border-magenta-glow/10 transition-all duration-300" id="navbar">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-purple-deep via-magenta-glow to-purple-neon rounded-lg flex items-center justify-center shadow-lg shadow-magenta-glow/25">
                        <span class="text-white text-lg font-bold">E</span>
                    </div>
                    <a href="index.html" class="text-magenta-glow2 font-bold tracking-tight hover:text-magenta-glow3 transition-colors">
                        Embro<span class="text-magenta-glow">Mine</span>
                    </a>
                </div>

                <div class="hidden lg:block">
                    <div class="ml-10 flex items-baseline space-x-4">
                        <a href="index.html" class="text-purple-soft px-3 py-2 rounded-md text-sm font-medium">Главная</a>
                        
                        <div class="relative group inline-block">
                            <button class="hover:text-magenta-glow transition-colors px-3 py-2 rounded-md text-sm font-medium flex items-center">
                                О сервере <span class="ml-1 text-xs">▼</span>
                            </button>
                            <div class="absolute left-0 mt-0 w-56 bg-void-dark rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 border border-purple-deep/30">
                                <a href="description.html" class="block px-4 py-2 text-sm text-purple-soft/70 hover:text-purple-soft hover:bg-purple-royal/10">Описание</a>
                                <a href="mechanics.html" class="block px-4 py-2 text-sm text-purple-soft/70 hover:text-purple-soft hover:bg-purple-neon/10">Механики</a>
                            </div>
                        </div>

                        <div id="auth-zone" class="inline-block">
                            </div>
                    </div>
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
    const token = localStorage.getItem('token');

    if (token) {
        authZone.innerHTML = `
            <a href="dashboard.html" class="text-purple-soft px-3 py-2 rounded-md text-sm font-medium hover:text-magenta-glow">Личный кабинет</a>
            <button onclick="logout()" class="ml-4 text-red-400 text-sm font-medium">Выход</button>
        `;
    } else {
        authZone.innerHTML = `
            <a href="login.html" class="hover:text-purple-soft transition-colors px-3 py-2 rounded-md text-sm font-medium">Вход</a>
        `;
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}