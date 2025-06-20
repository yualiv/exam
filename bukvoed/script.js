// Инициализация данных при первом запуске
function initializeData() {
    if (!localStorage.getItem('bookwormUsers')) {
        const initialUsers = [
            {
                login: 'admin',
                password: 'bookworm',
                fullName: 'Администратор',
                phone: '+7(000)-000-00-00',
                email: 'admin@bookworm.ru',
                isAdmin: true
            }
        ];
        localStorage.setItem('bookwormUsers', JSON.stringify(initialUsers));
    }

    if (!localStorage.getItem('bookwormCards')) {
        localStorage.setItem('bookwormCards', JSON.stringify([]));
    }
}

// Проверка авторизации
function checkAuth() {
    const currentPage = window.location.pathname.split('/').pop();
    const publicPages = ['index.html', 'register.html', ''];
    
    // Если пользователь авторизован и пытается попасть на публичную страницу
    if (localStorage.getItem('bookwormAuth') && publicPages.includes(currentPage)) {
        const isAdmin = localStorage.getItem('bookwormIsAdmin') === 'true';
        window.location.href = isAdmin ? 'admin.html' : 'cards.html';
        return;
    }
    
    // Если пользователь не авторизован и пытается попасть на защищенную страницу
    if (!localStorage.getItem('bookwormAuth') && !publicPages.includes(currentPage)) {
        window.location.href = 'index.html';
        return;
    }
    
    // Проверка админских прав
    if (currentPage === 'admin.html' && localStorage.getItem('bookwormIsAdmin') !== 'true') {
        window.location.href = 'cards.html';
    }
}

// Получение данных
function getUsers() {
    return JSON.parse(localStorage.getItem('bookwormUsers')) || [];
}

function getCards() {
    return JSON.parse(localStorage.getItem('bookwormCards')) || [];
}

// Сохранение данных
function saveUsers(users) {
    localStorage.setItem('bookwormUsers', JSON.stringify(users));
}

function saveCards(cards) {
    localStorage.setItem('bookwormCards', JSON.stringify(cards));
}

// Основные обработчики
document.addEventListener('DOMContentLoaded', function() {
    initializeData();
    checkAuth();
    
    // Форматирование телефона
    document.querySelectorAll('input[type="tel"]').forEach(input => {
        input.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            let formattedValue = '';
            
            if (value.length > 0) formattedValue = '+7(' + value.substring(1, 4);
            if (value.length >= 4) formattedValue += ')-' + value.substring(4, 7);
            if (value.length >= 7) formattedValue += '-' + value.substring(7, 9);
            if (value.length >= 9) formattedValue += '-' + value.substring(9, 11);
            
            this.value = formattedValue;
        });
    });

    // Регистрация
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const users = getUsers();
            const newUser = {
                login: document.getElementById('regLogin').value.trim(),
                password: document.getElementById('regPassword').value.trim(),
                fullName: document.getElementById('fullName').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                email: document.getElementById('email').value.trim(),
                isAdmin: false
            };
            
            if (users.some(u => u.login.toLowerCase() === newUser.login.toLowerCase())) {
                alert('Этот логин уже занят');
                return;
            }
            
            users.push(newUser);
            saveUsers(users);
            
            alert('Регистрация успешна! Теперь войдите.');
            window.location.href = 'index.html';
        });
    }
    
    // Авторизация
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const login = document.getElementById('login').value.trim();
            const password = document.getElementById('password').value.trim();
            const users = getUsers();
            const user = users.find(u => 
                u.login.toLowerCase() === login.toLowerCase() && 
                u.password === password
            );
            
            if (!user) {
                alert('Неверный логин или пароль');
                return;
            }
            
            localStorage.setItem('bookwormAuth', 'true');
            localStorage.setItem('bookwormIsAdmin', user.isAdmin ? 'true' : 'false');
            localStorage.setItem('bookwormCurrentUser', JSON.stringify(user));
            
            window.location.href = user.isAdmin ? 'admin.html' : 'cards.html';
        });
    }
    
    // Выход
    document.querySelectorAll('#logout').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('bookwormAuth');
            localStorage.removeItem('bookwormIsAdmin');
            localStorage.removeItem('bookwormCurrentUser');
            window.location.href = 'index.html';
        });
    });
    
    // Новая карточка
    const cardForm = document.getElementById('cardForm');
    if (cardForm) {
        cardForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const user = JSON.parse(localStorage.getItem('bookwormCurrentUser'));
            if (!user) {
                alert('Ошибка авторизации');
                window.location.href = 'index.html';
                return;
            }
            
            const cards = getCards();
            const newCard = {
                id: Date.now(),
                user: {
                    login: user.login,
                    fullName: user.fullName,
                    phone: user.phone,
                    email: user.email
                },
                author: document.getElementById('bookAuthor').value.trim(),
                title: document.getElementById('bookTitle').value.trim(),
                type: document.querySelector('input[name="cardType"]:checked').value,
                comments: document.getElementById('comments').value.trim(),
                status: 'pending',
                rejectionReason: null,
                createdAt: new Date().toISOString()
            };
            
            cards.push(newCard);
            saveCards(cards);
            
            alert('Карточка успешно создана и отправлена на рассмотрение!');
            window.location.href = 'cards.html';
        });
    }
    
    // Отображение карточек пользователя
    if (window.location.pathname.split('/').pop() === 'cards.html') {
        const user = JSON.parse(localStorage.getItem('bookwormCurrentUser'));
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        
        const cards = getCards();
        const userCards = cards.filter(card => card.user.login === user.login);
        
        const renderCards = (filter = 'active') => {
            let filteredCards = [];
            
            switch(filter) {
                case 'active':
                    filteredCards = userCards.filter(card => card.status === 'published');
                    break;
                case 'pending':
                    filteredCards = userCards.filter(card => card.status === 'pending');
                    break;
                case 'rejected':
                    filteredCards = userCards.filter(card => card.status === 'rejected');
                    break;
                case 'archive':
                    filteredCards = userCards.filter(card => card.status === 'archive');
                    break;
                default:
                    filteredCards = userCards;
            }
            
            const cardsList = document.getElementById('cardsList');
            if (filteredCards.length > 0) {
                cardsList.innerHTML = filteredCards.map(card => `
                    <div class="book-card">
                        <h3>${card.title}</h3>
                        <p class="author">${card.author}</p>
                        <span class="type">${card.type === 'share' ? 'Готов поделиться' : 'Хочу в библиотеку'}</span>
                        <span class="status status-${card.status}">
                            ${card.status === 'pending' ? 'На рассмотрении' : 
                             card.status === 'published' ? 'Опубликовано' : 
                             card.status === 'rejected' ? 'Отклонено' : 'Архив'}
                        </span>
                        
                        ${card.comments ? `<p>${card.comments}</p>` : ''}
                        
                        ${card.rejectionReason ? `
                        <div class="reason">
                            <strong>Причина отклонения:</strong> ${card.rejectionReason}
                        </div>
                        ` : ''}
                        
                        <div class="user">
                            Создано: ${new Date(card.createdAt).toLocaleDateString()}
                        </div>
                        
                        <div class="actions">
                            ${card.status !== 'archive' ? `
                            <button class="btn btn-delete" data-id="${card.id}">Удалить</button>
                            ` : ''}
                        </div>
                    </div>
                `).join('');
            } else {
                cardsList.innerHTML = '<p>Нет карточек в этой категории</p>';
            }
        };
        
        // Обработка вкладок
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                renderCards(this.dataset.tab);
            });
        });
        
        // Удаление карточек
        document.getElementById('cardsList').addEventListener('click', function(e) {
            if (e.target.classList.contains('btn-delete')) {
                const cardId = parseInt(e.target.dataset.id);
                const cards = getCards();
                const cardIndex = cards.findIndex(c => c.id === cardId);
                
                if (cardIndex !== -1 && confirm('Переместить карточку в архив?')) {
                    cards[cardIndex].status = 'archive';
                    saveCards(cards);
                    
                    const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
                    renderCards(activeTab);
                }
            }
        });
        
        // Первоначальная загрузка
        renderCards();
    }
    
    // Админ-панель
    if (window.location.pathname.split('/').pop() === 'admin.html') {
        const cards = getCards();
        const statusFilter = document.getElementById('statusFilter');
        const cardsList = document.getElementById('adminCardsList');
        
        const renderAdminCards = (filter = 'all') => {
            const filteredCards = filter === 'all' ? cards : 
                cards.filter(card => card.status === filter);
            
            cardsList.innerHTML = filteredCards.length > 0 ? filteredCards.map(card => `
                <div class="book-card">
                    <h3>${card.title}</h3>
                    <p class="author">${card.author}</p>
                    <span class="type">${card.type === 'share' ? 'Готов поделиться' : 'Хочу в библиотеку'}</span>
                    <span class="status status-${card.status}">
                        ${card.status === 'pending' ? 'На рассмотрении' : 
                         card.status === 'published' ? 'Опубликовано' : 
                         card.status === 'rejected' ? 'Отклонено' : 'Архив'}
                    </span>
                    
                    ${card.comments ? `<p>${card.comments}</p>` : ''}
                    
                    <div class="user">
                        <strong>Пользователь:</strong> ${card.user.fullName}<br>
                        <strong>Контакты:</strong> ${card.user.phone}, ${card.user.email}<br>
                        <strong>Создано:</strong> ${new Date(card.createdAt).toLocaleString()}
                    </div>
                    
                    ${card.status === 'pending' ? `
                    <div class="actions">
                        <button class="btn btn-publish" data-id="${card.id}">Опубликовать</button>
                        <button class="btn btn-reject" data-id="${card.id}">Отклонить</button>
                    </div>
                    ` : ''}
                    
                    ${card.rejectionReason ? `
                    <div class="reason">
                        <strong>Причина отклонения:</strong> ${card.rejectionReason}
                    </div>
                    ` : ''}
                </div>
            `).join('') : '<p>Нет карточек</p>';
        };
        
        // Фильтрация
        statusFilter.addEventListener('change', function() {
            renderAdminCards(this.value === 'all' ? 'all' : this.value);
        });
        
        // Действия администратора
        cardsList.addEventListener('click', function(e) {
            if (!e.target.dataset.id) return;
            
            const cardId = parseInt(e.target.dataset.id);
            const cards = getCards();
            const cardIndex = cards.findIndex(c => c.id === cardId);
            
            if (cardIndex === -1) return;
            
            if (e.target.classList.contains('btn-publish')) {
                cards[cardIndex].status = 'published';
                cards[cardIndex].rejectionReason = null;
                saveCards(cards);
                alert('Карточка опубликована');
                renderAdminCards(statusFilter.value === 'all' ? 'all' : statusFilter.value);
            } 
            else if (e.target.classList.contains('btn-reject')) {
                const reason = prompt('Укажите причину отклонения:');
                if (reason) {
                    cards[cardIndex].status = 'rejected';
                    cards[cardIndex].rejectionReason = reason;
                    saveCards(cards);
                    alert('Карточка отклонена');
                    renderAdminCards(statusFilter.value === 'all' ? 'all' : statusFilter.value);
                }
            }
        });
        
        // Первоначальная загрузка
        renderAdminCards();
    }
});