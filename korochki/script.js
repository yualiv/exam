// Инициализация данных
function initStorage() {
    if (!localStorage.getItem('diplomaData')) {
        const initialData = {
            users: [
                {
                    login: 'admin',
                    password: 'education',
                    fullName: 'Администратор',
                    phone: '+7(000)-000-00-00',
                    email: 'admin@diploma.ru',
                    isAdmin: true
                }
            ],
            applications: []
        };
        localStorage.setItem('diplomaData', JSON.stringify(initialData));
    }
}

// Получение данных
function getData() {
    return JSON.parse(localStorage.getItem('diplomaData')) || { users: [], applications: [] };
}

// Сохранение данных
function saveData(data) {
    localStorage.setItem('diplomaData', JSON.stringify(data));
}

// Проверка авторизации
function checkAuth() {
    const currentPage = window.location.pathname.split('/').pop();
    const publicPages = ['index.html', 'register.html', ''];
    const authToken = localStorage.getItem('diplomaAuthToken');
    
    if (authToken && publicPages.includes(currentPage)) {
        const user = JSON.parse(localStorage.getItem('diplomaCurrentUser'));
        window.location.href = user.isAdmin ? 'admin.html' : 'applications.html';
        return;
    }
    
    if (!authToken && !publicPages.includes(currentPage)) {
        window.location.href = 'index.html';
        return;
    }
    
    if (currentPage === 'admin.html') {
        const user = JSON.parse(localStorage.getItem('diplomaCurrentUser'));
        if (!user || !user.isAdmin) {
            window.location.href = 'applications.html';
        }
    }
}

// Основная логика
document.addEventListener('DOMContentLoaded', function() {
    initStorage();
    checkAuth();
    
    // Форматирование телефона
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function(e) {
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
            
            const data = getData();
            const newUser = {
                login: document.getElementById('regLogin').value.trim(),
                password: document.getElementById('regPassword').value.trim(),
                fullName: document.getElementById('fullName').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                email: document.getElementById('email').value.trim(),
                isAdmin: false
            };
            
            // Проверка уникальности логина
            if (data.users.some(u => u.login.toLowerCase() === newUser.login.toLowerCase())) {
                alert('Этот логин уже занят');
                return;
            }
            
            data.users.push(newUser);
            saveData(data);
            
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
            const data = getData();
            
            // Поиск пользователя
            const user = data.users.find(u => 
                u.login.toLowerCase() === login.toLowerCase() && 
                u.password === password
            );
            
            if (!user) {
                alert('Неверный логин или пароль');
                return;
            }
            
            // Сохраняем данные авторизации
            localStorage.setItem('diplomaAuthToken', 'true');
            localStorage.setItem('diplomaCurrentUser', JSON.stringify(user));
            
            window.location.href = user.isAdmin ? 'admin.html' : 'applications.html';
        });
    }
    
    // Выход
    const logoutButtons = document.querySelectorAll('#logout');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('diplomaAuthToken');
            localStorage.removeItem('diplomaCurrentUser');
            window.location.href = 'index.html';
        });
    });
    
    // Новая заявка
    const applicationForm = document.getElementById('applicationForm');
    if (applicationForm) {
        applicationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const user = JSON.parse(localStorage.getItem('diplomaCurrentUser'));
            if (!user) {
                alert('Ошибка авторизации');
                window.location.href = 'index.html';
                return;
            }
            
            const data = getData();
            const newApplication = {
                id: Date.now(),
                userId: user.login,
                userData: {
                    fullName: user.fullName,
                    phone: user.phone,
                    email: user.email
                },
                courseName: document.getElementById('courseName').value.trim(),
                startDate: document.getElementById('startDate').value,
                paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
                comments: document.getElementById('comments').value.trim(),
                status: 'new',
                createdAt: new Date().toISOString(),
                review: null
            };
            
            data.applications.push(newApplication);
            saveData(data);
            
            alert('Заявка успешно отправлена на рассмотрение!');
            window.location.href = 'applications.html';
        });
    }
    
    // Отображение заявок пользователя
    if (window.location.pathname.split('/').pop() === 'applications.html') {
        const user = JSON.parse(localStorage.getItem('diplomaCurrentUser'));
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        
        const data = getData();
        const userApplications = data.applications.filter(app => app.userId === user.login);
        
        const renderApplications = (filter = 'all') => {
            let filteredApps = userApplications;
            
            if (filter === 'new') filteredApps = userApplications.filter(app => app.status === 'new');
            else if (filter === 'in-progress') filteredApps = userApplications.filter(app => app.status === 'in-progress');
            else if (filter === 'completed') filteredApps = userApplications.filter(app => app.status === 'completed');
            
            const appsList = document.getElementById('applicationsList');
            if (filteredApps.length > 0) {
                appsList.innerHTML = filteredApps.map(app => `
                    <div class="application-card">
                        <h3>${app.courseName}</h3>
                        <p class="date">Дата начала: ${new Date(app.startDate).toLocaleDateString()}</p>
                        <p class="payment">Способ оплаты: ${app.paymentMethod === 'cash' ? 'Наличные' : 'Банковский перевод'}</p>
                        <span class="status status-${app.status.replace('-', '')}">
                            ${app.status === 'new' ? 'Новая' : 
                             app.status === 'in-progress' ? 'В процессе' : 'Завершена'}
                        </span>
                        
                        ${app.comments ? `<p>${app.comments}</p>` : ''}
                        
                        ${app.status === 'completed' && !app.review ? `
                        <div class="review-form">
                            <h4>Оставить отзыв</h4>
                            <textarea id="review-${app.id}" placeholder="Ваш отзыв о курсе"></textarea>
                            <button class="btn" onclick="submitReview(${app.id})">Отправить отзыв</button>
                        </div>
                        ` : ''}
                        
                        ${app.review ? `
                        <div class="review">
                            <h4>Ваш отзыв:</h4>
                            <p>${app.review}</p>
                        </div>
                        ` : ''}
                    </div>
                `).join('');
            } else {
                appsList.innerHTML = '<p>Нет заявок в этой категории</p>';
            }
        };
        
        // Обработка вкладок
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                renderApplications(this.dataset.tab);
            });
        });
        
        // Первоначальная загрузка
        renderApplications();
    }
    
    // Админ-панель
    if (window.location.pathname.split('/').pop() === 'admin.html') {
        const data = getData();
        const statusFilter = document.getElementById('statusFilter');
        const searchInput = document.getElementById('searchInput');
        const appsList = document.getElementById('adminApplicationsList');
        
        const renderAdminApplications = () => {
            const filter = statusFilter.value;
            const searchTerm = searchInput.value.toLowerCase();
            
            let filteredApps = data.applications;
            
            // Фильтрация по статусу
            if (filter !== 'all') {
                filteredApps = filteredApps.filter(app => app.status === filter);
            }
            
            // Поиск
            if (searchTerm) {
                filteredApps = filteredApps.filter(app => 
                    app.courseName.toLowerCase().includes(searchTerm) || 
                    app.userData.fullName.toLowerCase().includes(searchTerm)
                );
            }
            
            // Сортировка по дате (новые сначала)
            filteredApps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            appsList.innerHTML = filteredApps.length > 0 ? filteredApps.map(app => `
                <div class="application-card">
                    <h3>${app.courseName}</h3>
                    <p class="date">Дата начала: ${new Date(app.startDate).toLocaleDateString()}</p>
                    <p class="payment">Способ оплаты: ${app.paymentMethod === 'cash' ? 'Наличные' : 'Банковский перевод'}</p>
                    <span class="status status-${app.status.replace('-', '')}">
                        ${app.status === 'new' ? 'Новая' : 
                         app.status === 'in-progress' ? 'В процессе' : 'Завершена'}
                    </span>
                    
                    ${app.comments ? `<p>Комментарии: ${app.comments}</p>` : ''}
                    
                    <div class="user">
                        <strong>Пользователь:</strong> ${app.userData.fullName}<br>
                        <strong>Контакты:</strong> ${app.userData.phone}, ${app.userData.email}
                    </div>
                    
                    ${app.review ? `
                    <div class="review">
                        <strong>Отзыв:</strong> ${app.review}
                    </div>
                    ` : ''}
                    
                    <div class="actions">
                        ${app.status === 'new' ? `
                        <button class="btn btn-approve" data-id="${app.id}">Начать обучение</button>
                        ` : ''}
                        
                        ${app.status === 'in-progress' ? `
                        <button class="btn btn-complete" data-id="${app.id}">Завершить обучение</button>
                        ` : ''}
                    </div>
                </div>
            `).join('') : '<p>Нет заявок по выбранным критериям</p>';
        };
        
        // Обработчики событий
        statusFilter.addEventListener('change', renderAdminApplications);
        searchInput.addEventListener('input', renderAdminApplications);
        
        // Обработка действий администратора
        appsList.addEventListener('click', function(e) {
            if (!e.target.dataset.id) return;
            
            const appId = parseInt(e.target.dataset.id);
            const data = getData();
            const appIndex = data.applications.findIndex(a => a.id === appId);
            
            if (appIndex === -1) return;
            
            if (e.target.classList.contains('btn-approve')) {
                data.applications[appIndex].status = 'in-progress';
                saveData(data);
                alert('Обучение начато');
                renderAdminApplications();
            } 
            else if (e.target.classList.contains('btn-complete')) {
                data.applications[appIndex].status = 'completed';
                saveData(data);
                alert('Обучение завершено');
                renderAdminApplications();
            }
        });
        
        // Первоначальная загрузка
        renderAdminApplications();
    }
});

// Функция для отправки отзыва (глобальная)
function submitReview(appId) {
    const reviewText = document.getElementById(`review-${appId}`)?.value.trim();
    if (!reviewText) {
        alert('Пожалуйста, напишите отзыв');
        return;
    }
    
    const data = JSON.parse(localStorage.getItem('diplomaData'));
    const appIndex = data.applications.findIndex(a => a.id === appId);
    
    if (appIndex !== -1) {
        data.applications[appIndex].review = reviewText;
        localStorage.setItem('diplomaData', JSON.stringify(data));
        alert('Спасибо за ваш отзыв!');
        window.location.reload();
    }
}