// Имитация базы данных
let db = {
    users: [
        {
            id: 1,
            username: "admin",
            password: "education",
            fio: "Администратор Системы",
            phone: "+7(999)-999-99-99",
            email: "admin@korochki.est",
            isAdmin: true
        }
    ],
    applications: [],
    feedbacks: []
};

// Проверка, есть ли данные в localStorage
if (localStorage.getItem('korochkiDB')) {
    db = JSON.parse(localStorage.getItem('korochkiDB'));
} else {
    localStorage.setItem('korochkiDB', JSON.stringify(db));
}

// Сохранение данных
function saveDB() {
    localStorage.setItem('korochkiDB', JSON.stringify(db));
}

// Текущий пользователь
let currentUser = null;

// DOM элементы
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');
const showRegister = document.getElementById('show-register');
const showLogin = document.getElementById('show-login');
const loginFormContainer = document.getElementById('login-form');
const registerFormContainer = document.getElementById('register-form');

// Переключение между формами входа и регистрации
if (showRegister && showLogin) {
    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormContainer.classList.add('hidden');
        registerFormContainer.classList.remove('hidden');
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerFormContainer.classList.add('hidden');
        loginFormContainer.classList.remove('hidden');
    });
}

// Вход в систему
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        const user = db.users.find(u => u.username === username && u.password === password);
        
        if (user) {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            if (user.isAdmin) {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'user.html';
            }
        } else {
            loginError.textContent = 'Неверный логин или пароль';
        }
    });
}

// Регистрация нового пользователя
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const fio = document.getElementById('reg-fio').value;
        const phone = document.getElementById('reg-phone').value;
        const email = document.getElementById('reg-email').value;
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
        
        // Проверка уникальности логина
        const usernameExists = db.users.some(u => u.username === username);
        
        if (usernameExists) {
            registerError.textContent = 'Этот логин уже занят';
            return;
        }
        
        // Создание нового пользователя
        const newUser = {
            id: db.users.length + 1,
            username,
            password,
            fio,
            phone,
            email,
            isAdmin: false
        };
        
        db.users.push(newUser);
        saveDB();
        
        registerError.textContent = '';
        alert('Регистрация прошла успешно! Теперь вы можете войти.');
        registerFormContainer.classList.add('hidden');
        loginFormContainer.classList.remove('hidden');
        loginForm.reset();
        registerForm.reset();
    });
}

// Личный кабинет пользователя
if (document.getElementById('current-user')) {
    // Загрузка текущего пользователя
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        document.getElementById('current-user').textContent = currentUser.fio;
    } else {
        window.location.href = 'index.html';
    }
    
    // Навигация
    const navButtons = document.querySelectorAll('.nav-btn');
    const contentSections = document.querySelectorAll('.content-section');
    
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const target = button.getAttribute('data-target');
            
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            contentSections.forEach(section => section.classList.add('hidden'));
            document.getElementById(target).classList.remove('hidden');
        });
    });
    
    // Выход из системы
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
    
    // Загрузка заявок пользователя
    function loadUserApplications() {
        const applicationsList = document.getElementById('applications-list');
        applicationsList.innerHTML = '';
        
        const userApplications = db.applications.filter(app => app.userId === currentUser.id);
        
        if (userApplications.length === 0) {
            applicationsList.innerHTML = '<p>У вас пока нет заявок на обучение.</p>';
            return;
        }
        
        userApplications.forEach(app => {
            const statusClass = `status-${app.status.replace(' ', '-')}`;
            const statusText = getStatusText(app.status);
            
            const card = document.createElement('div');
            card.className = `application-card ${statusClass}`;
            card.innerHTML = `
                <h3>${app.courseName}</h3>
                <div class="application-meta">
                    <span>Дата начала: ${app.startDate}</span>
                    <span>Статус: ${statusText}</span>
                </div>
                <p>Способ оплаты: ${app.payment === 'cash' ? 'Наличные' : 'Банковский перевод'}</p>
                ${app.feedback ? `
                <div class="feedback">
                    <p><strong>Ваш отзыв:</strong> ${app.feedback.text}</p>
                    <p><strong>Оценка:</strong> ${app.feedback.rating}/5</p>
                </div>
                ` : app.status === 'completed' ? `
                <div class="application-actions">
                    <button class="leave-feedback" data-app-id="${app.id}">Оставить отзыв</button>
                </div>
                ` : ''}
            `;
            
            applicationsList.appendChild(card);
        });
        
        // Обработчики для кнопок отзывов
        document.querySelectorAll('.leave-feedback').forEach(button => {
            button.addEventListener('click', (e) => {
                const appId = parseInt(e.target.getAttribute('data-app-id'));
                openFeedbackModal(appId);
            });
        });
    }
    
    // Открытие модального окна для отзыва
    function openFeedbackModal(appId) {
        const modal = document.getElementById('feedback-modal');
        document.getElementById('feedback-app-id').value = appId;
        modal.classList.remove('hidden');
    }
    
    // Закрытие модального окна
    document.querySelector('.close-modal')?.addEventListener('click', () => {
        document.getElementById('feedback-modal').classList.add('hidden');
    });
    
    // Отправка отзыва
    if (document.getElementById('feedbackForm')) {
        document.getElementById('feedbackForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const appId = parseInt(document.getElementById('feedback-app-id').value);
            const text = document.getElementById('feedback-text').value;
            const rating = parseInt(document.getElementById('feedback-rating').value);
            
            const feedback = {
                id: db.feedbacks.length + 1,
                applicationId: appId,
                text,
                rating,
                date: new Date().toISOString()
            };
            
            // Находим заявку и добавляем отзыв
            const application = db.applications.find(app => app.id === appId);
            if (application) {
                application.feedback = feedback;
                db.feedbacks.push(feedback);
                saveDB();
                
                document.getElementById('feedback-modal').classList.add('hidden');
                loadUserApplications();
            }
        });
    }
    
    // Создание новой заявки
    if (document.getElementById('applicationForm')) {
        document.getElementById('applicationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const courseName = document.getElementById('course-name').value;
            const startDate = document.getElementById('start-date').value;
            const payment = document.querySelector('input[name="payment"]:checked').value;
            
            const newApplication = {
                id: db.applications.length + 1,
                userId: currentUser.id,
                courseName,
                startDate,
                payment,
                status: 'new',
                createdAt: new Date().toISOString()
            };
            
            db.applications.push(newApplication);
            saveDB();
            
            alert('Заявка успешно отправлена!');
            document.getElementById('applicationForm').reset();
            document.querySelector('[data-target="my-applications"]').click();
            loadUserApplications();
        });
    }
    
    // Загрузка данных при открытии страницы
    loadUserApplications();
}

// Панель администратора
if (document.getElementById('admin-applications-list')) {
    // Проверка прав администратора
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        if (!currentUser.isAdmin) {
            window.location.href = 'index.html';
        }
    } else {
        window.location.href = 'index.html';
    }
    
    // Выход из системы
    document.getElementById('admin-logout-btn').addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
    
    // Загрузка всех заявок
    function loadAllApplications(filter = 'all') {
        const applicationsList = document.getElementById('admin-applications-list');
        applicationsList.innerHTML = '';
        
        let applicationsToShow = db.applications;
        
        if (filter !== 'all') {
            applicationsToShow = applicationsToShow.filter(app => app.status.replace(' ', '-') === filter);
        }
        
        if (applicationsToShow.length === 0) {
            applicationsList.innerHTML = '<p>Нет заявок для отображения.</p>';
            return;
        }
        
        // Добавляем информацию о пользователе к заявкам
        const applicationsWithUsers = applicationsToShow.map(app => {
            const user = db.users.find(u => u.id === app.userId);
            return {
                ...app,
                userInfo: user ? `${user.fio} (${user.phone}, ${user.email})` : 'Неизвестный пользователь'
            };
        });
        
        applicationsWithUsers.forEach(app => {
            const statusClass = `status-${app.status.replace(' ', '-')}`;
            const statusText = getStatusText(app.status);
            
            const card = document.createElement('div');
            card.className = `application-card ${statusClass}`;
            card.innerHTML = `
                <h3>${app.courseName}</h3>
                <div class="application-meta">
                    <span>Дата начала: ${app.startDate}</span>
                    <span>Статус: ${statusText}</span>
                </div>
                <p>Способ оплаты: ${app.payment === 'cash' ? 'Наличные' : 'Банковский перевод'}</p>
                <p><strong>Пользователь:</strong> ${app.userInfo}</p>
                <p><strong>Дата создания:</strong> ${new Date(app.createdAt).toLocaleString()}</p>
                ${app.feedback ? `
                <div class="feedback">
                    <p><strong>Отзыв:</strong> ${app.feedback.text}</p>
                    <p><strong>Оценка:</strong> ${app.feedback.rating}/5</p>
                </div>
                ` : ''}
                <div class="application-actions">
                    <button class="change-status" data-app-id="${app.id}">Изменить статус</button>
                </div>
            `;
            
            applicationsList.appendChild(card);
        });
        
        // Обработчики для кнопок изменения статуса
        document.querySelectorAll('.change-status').forEach(button => {
            button.addEventListener('click', (e) => {
                const appId = parseInt(e.target.getAttribute('data-app-id'));
                openStatusModal(appId);
            });
        });
    }
    
    // Открытие модального окна для изменения статуса
    function openStatusModal(appId) {
        const modal = document.getElementById('status-modal');
        document.getElementById('status-app-id').value = appId;
        
        // Устанавливаем текущий статус в селектор
        const application = db.applications.find(app => app.id === appId);
        if (application) {
            document.getElementById('new-status').value = application.status;
        }
        
        modal.classList.remove('hidden');
    }
    
    // Закрытие модального окна
    document.querySelector('.close-modal')?.addEventListener('click', () => {
        document.getElementById('status-modal').classList.add('hidden');
    });
    
    // Изменение статуса заявки
    if (document.getElementById('statusForm')) {
        document.getElementById('statusForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const appId = parseInt(document.getElementById('status-app-id').value);
            const newStatus = document.getElementById('new-status').value;
            
            const application = db.applications.find(app => app.id === appId);
            if (application) {
                application.status = newStatus;
                saveDB();
                
                document.getElementById('status-modal').classList.add('hidden');
                loadAllApplications(document.getElementById('status-filter').value);
            }
        });
    }
    
    // Фильтрация заявок
    document.getElementById('status-filter').addEventListener('change', (e) => {
        loadAllApplications(e.target.value);
    });
    
    // Загрузка данных при открытии страницы
    loadAllApplications();
}

// Вспомогательные функции
function getStatusText(status) {
    const statusMap = {
        'new': 'Новая',
        'in-progress': 'Идет обучение',
        'completed': 'Обучение завершено'
    };
    return statusMap[status] || status;
}