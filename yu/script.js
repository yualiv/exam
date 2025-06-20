// Инициализация хранилищ при первом запуске
if (!localStorage.getItem('restaurantUsers')) {
    localStorage.setItem('restaurantUsers', JSON.stringify([
        {
            login: 'admin',
            password: 'restaurant',
            firstName: 'Admin',
            lastName: 'Adminov',
            phone: '+7(123)-456-78-90',
            email: 'admin@restaurant.ru',
            isAdmin: true
        }
    ]));
}

if (!localStorage.getItem('restaurantBookings')) {
    localStorage.setItem('restaurantBookings', JSON.stringify([]));
}

// Проверка авторизации
function checkAuth() {
    const isAuth = localStorage.getItem('isAuth');
    const currentPage = window.location.pathname.split('/').pop();
    
    if (isAuth === 'true' && (currentPage === 'index.html' || currentPage === '' || currentPage === 'register.html')) {
        window.location.href = 'bookings.html';
        return;
    }
    
    if (isAuth !== 'true' && currentPage !== 'index.html' && currentPage !== '' && currentPage !== 'register.html') {
        window.location.href = 'index.html';
        return;
    }
    
    // Проверка админских прав
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (currentPage === 'admin.html' && !isAdmin) {
        window.location.href = 'bookings.html';
    }
}

// Получение данных
function getUsers() {
    return JSON.parse(localStorage.getItem('restaurantUsers'));
}

function getBookings() {
    return JSON.parse(localStorage.getItem('restaurantBookings'));
}

// Сохранение данных
function saveUsers(users) {
    localStorage.setItem('restaurantUsers', JSON.stringify(users));
}

function saveBookings(bookings) {
    localStorage.setItem('restaurantBookings', JSON.stringify(bookings));
}

// Форматирование даты
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU');
}

// Основные обработчики
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    
    // Форматирование телефона
    const formatPhone = (input) => {
        let value = input.value.replace(/\D/g, '');
        let formattedValue = '';
        
        if (value.length > 0) formattedValue = '+7(' + value.substring(1, 4);
        if (value.length >= 4) formattedValue += ')-' + value.substring(4, 7);
        if (value.length >= 7) formattedValue += '-' + value.substring(7, 9);
        if (value.length >= 9) formattedValue += '-' + value.substring(9, 11);
        
        input.value = formattedValue;
    };
    
    document.querySelectorAll('input[type="tel"]').forEach(input => {
        input.addEventListener('input', () => formatPhone(input));
    });

    // Регистрация
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const users = getUsers();
            const newUser = {
                login: document.getElementById('regLogin').value,
                password: document.getElementById('regPassword').value,
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                phone: document.getElementById('phone').value,
                email: document.getElementById('email').value,
                isAdmin: false
            };
            
            if (users.some(u => u.login === newUser.login)) {
                alert('Логин уже занят');
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
            
            const login = document.getElementById('login').value;
            const password = document.getElementById('password').value;
            const users = getUsers();
            const user = users.find(u => u.login === login && u.password === password);
            
            if (!user) {
                alert('Неверный логин или пароль');
                return;
            }
            
            localStorage.setItem('isAuth', 'true');
            localStorage.setItem('isAdmin', user.isAdmin ? 'true' : 'false');
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            window.location.href = user.isAdmin ? 'admin.html' : 'bookings.html';
        });
    }
    
    // Выход
    document.querySelectorAll('#logout').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('isAuth');
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
    });
    
    // Новое бронирование
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const user = JSON.parse(localStorage.getItem('currentUser'));
            const bookings = getBookings();
            
            bookings.push({
                id: Date.now(),
                user: {
                    login: user.login,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phone: document.getElementById('contactPhone').value || user.phone,
                    email: user.email
                },
                date: document.getElementById('bookingDate').value,
                guestsCount: document.getElementById('guestsCount').value,
                specialRequests: document.getElementById('specialRequests').value,
                status: 'new',
                review: null
            });
            
            saveBookings(bookings);
            alert('Бронирование создано!');
            window.location.href = 'bookings.html';
        });
    }
    
    // Отображение бронирований пользователя
    if (window.location.pathname.split('/').pop() === 'bookings.html') {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        const bookings = getBookings().filter(b => b.user.login === user.login);
        const bookingsList = document.getElementById('bookingsList');
        
        if (bookings.length > 0) {
            bookingsList.innerHTML = bookings.map(booking => `
                <div class="booking-card">
                    <h3>Бронирование #${booking.id}</h3>
                    <span class="status status-${booking.status}">
                        ${booking.status === 'new' ? 'Новое' : 
                         booking.status === 'confirmed' ? 'Подтверждено' : 
                         booking.status === 'completed' ? 'Посещение состоялось' : 'Отменено'}
                    </span>
                    <p><strong>Дата:</strong> ${formatDate(booking.date)}</p>
                    <p><strong>Гости:</strong> ${booking.guestsCount}</p>
                    <p><strong>Телефон:</strong> ${booking.user.phone}</p>
                    ${booking.specialRequests ? `<p><strong>Пожелания:</strong> ${booking.specialRequests}</p>` : ''}
                    
                    ${booking.status === 'completed' && !booking.review ? `
                    <div class="review-form">
                        <h4>Оставить отзыв</h4>
                        <textarea id="review-${booking.id}" placeholder="Ваш отзыв"></textarea>
                        <button onclick="addReview(${booking.id})" class="btn">Отправить</button>
                    </div>
                    ` : ''}
                    
                    ${booking.review ? `
                    <div class="review">
                        <h4>Ваш отзыв:</h4>
                        <p>${booking.review}</p>
                    </div>
                    ` : ''}
                </div>
            `).join('');
        } else {
            bookingsList.innerHTML = '<p>У вас нет бронирований</p>';
        }
    }
    
    // Админ-панель
    if (window.location.pathname.split('/').pop() === 'admin.html') {
        const statusFilter = document.getElementById('statusFilter');
        const bookingsList = document.getElementById('adminBookingsList');
        
        function renderBookings(filter = 'all') {
            const bookings = getBookings();
            const filtered = filter === 'all' ? bookings : 
                bookings.filter(b => b.status === filter);
            
            bookingsList.innerHTML = filtered.length > 0 ? filtered.map(booking => `
                <div class="booking-card admin">
                    <h3>#${booking.id} - ${booking.user.firstName} ${booking.user.lastName}</h3>
                    <span class="status status-${booking.status}">
                        ${booking.status === 'new' ? 'Новое' : 
                         booking.status === 'confirmed' ? 'Подтверждено' : 
                         booking.status === 'completed' ? 'Посещение состоялось' : 'Отменено'}
                    </span>
                    <p><strong>Дата:</strong> ${formatDate(booking.date)}</p>
                    <p><strong>Гости:</strong> ${booking.guestsCount}</p>
                    <p><strong>Контакт:</strong> ${booking.user.phone}, ${booking.user.email}</p>
                    ${booking.specialRequests ? `<p><strong>Пожелания:</strong> ${booking.specialRequests}</p>` : ''}
                    ${booking.review ? `<p><strong>Отзыв:</strong> ${booking.review}</p>` : ''}
                    
                    <div class="admin-actions">
                        ${booking.status !== 'confirmed' ? 
                          `<button class="btn btn-confirm" data-id="${booking.id}">Подтвердить</button>` : ''}
                        ${booking.status !== 'completed' ? 
                          `<button class="btn btn-complete" data-id="${booking.id}">Завершить</button>` : ''}
                        ${booking.status !== 'cancelled' ? 
                          `<button class="btn btn-cancel" data-id="${booking.id}">Отменить</button>` : ''}
                        <button class="btn btn-delete" data-id="${booking.id}">Удалить</button>
                    </div>
                </div>
            `).join('') : '<p>Бронирований нет</p>';
        }
        
        statusFilter.addEventListener('change', () => renderBookings(statusFilter.value));
        renderBookings();
        
        // Обработка действий администратора
        bookingsList.addEventListener('click', (e) => {
            if (!e.target.dataset.id) return;
            
            const bookings = getBookings();
            const booking = bookings.find(b => b.id == e.target.dataset.id);
            if (!booking) return;
            
            if (e.target.classList.contains('btn-confirm')) {
                booking.status = 'confirmed';
            } 
            else if (e.target.classList.contains('btn-complete')) {
                booking.status = 'completed';
            } 
            else if (e.target.classList.contains('btn-cancel')) {
                booking.status = 'cancelled';
            } 
            else if (e.target.classList.contains('btn-delete')) {
                if (!confirm('Удалить бронирование?')) return;
                bookings.splice(bookings.indexOf(booking), 1);
            }
            
            saveBookings(bookings);
            renderBookings(statusFilter.value);
        });
    }
});

// Глобальная функция для отзывов
function addReview(bookingId) {
    const reviewText = document.getElementById(`review-${bookingId}`).value;
    if (!reviewText) {
        alert('Напишите отзыв');
        return;
    }
    
    const bookings = getBookings();
    const booking = bookings.find(b => b.id == bookingId);
    if (booking) {
        booking.review = reviewText;
        saveBookings(bookings);
        alert('Спасибо за отзыв!');
        window.location.reload();
    }
}