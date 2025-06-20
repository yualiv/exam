// Проверка авторизации
function checkAuth() {
    const isAuth = localStorage.getItem('isAuth');
    const currentPage = window.location.pathname.split('/').pop();
    
    if (isAuth === 'true' && (currentPage === 'index.html' || currentPage === '' || currentPage === 'register.html')) {
        window.location.href = 'dashboard.html';
    }
    
    if (isAuth !== 'true' && currentPage !== 'index.html' && currentPage !== '' && currentPage !== 'register.html') {
        window.location.href = 'index.html';
    }
    
    // Проверка админских прав
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (currentPage === 'admin.html' && !isAdmin) {
        window.location.href = 'dashboard.html';
    }
}

// Получение или инициализация хранилища пользователей
function getUsers() {
    const storedUsers = localStorage.getItem('users');
    return storedUsers ? JSON.parse(storedUsers) : [];
}

// Сохранение пользователей
function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

// Получение или инициализация хранилища заявок
function getOrders() {
    const storedOrders = localStorage.getItem('orders');
    return storedOrders ? JSON.parse(storedOrders) : [];
}

// Сохранение заявок
function saveOrders(orders) {
    localStorage.setItem('orders', JSON.stringify(orders));
}

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const login = document.getElementById('regLogin').value;
            const password = document.getElementById('regPassword').value;
            const fullName = document.getElementById('fullName').value;
            const phone = document.getElementById('phone').value;
            const email = document.getElementById('email').value;
            
            const users = getUsers();
            
            // Проверка уникальности логина
            if (users.some(user => user.login === login)) {
                alert('Этот логин уже занят');
                return;
            }
            
            // Сохранение пользователя
            users.push({
                login,
                password,
                fullName,
                phone,
                email
            });
            
            saveUsers(users);
            
            alert('Регистрация прошла успешно! Теперь вы можете войти.');
            window.location.href = 'index.html';
        });
    }
    
    // Обработка формы входа
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const login = document.getElementById('login').value;
            const password = document.getElementById('password').value;
            
            // Проверка администратора
            if (login === 'admin' && password === 'gruzovik2024') {
                localStorage.setItem('isAuth', 'true');
                localStorage.setItem('isAdmin', 'true');
                window.location.href = 'admin.html';
                return;
            }
            
            const users = getUsers();
            
            // Поиск пользователя
            const user = users.find(u => u.login === login && u.password === password);
            
            if (user) {
                localStorage.setItem('isAuth', 'true');
                localStorage.setItem('isAdmin', 'false');
                localStorage.setItem('currentUser', JSON.stringify(user));
                window.location.href = 'dashboard.html';
            } else {
                alert('Неверный логин или пароль');
            }
        });
    }
    
    // Обработка формы заявки
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            const orders = getOrders();
            
            const order = {
                id: Date.now(),
                user: currentUser,
                date: document.getElementById('orderDate').value,
                cargoType: document.getElementById('cargoType').value,
                cargoWeight: document.getElementById('cargoWeight').value,
                cargoDimensions: document.getElementById('cargoDimensions').value,
                fromAddress: document.getElementById('fromAddress').value,
                toAddress: document.getElementById('toAddress').value,
                status: 'pending'
            };
            
            orders.push(order);
            saveOrders(orders);
            
            alert('Заявка успешно создана и отправлена на рассмотрение!');
            window.location.href = 'dashboard.html';
        });
    }
    
    // Выход из системы
    const logoutButtons = document.querySelectorAll('#logout');
    logoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('isAuth');
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
    });
    
    // Форматирование телефона
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = this.value.replace(/\D/g, '');
            let formattedValue = '';
            
            if (value.length > 0) {
                formattedValue = '+7(' + value.substring(1, 4);
            }
            if (value.length >= 4) {
                formattedValue += ')-' + value.substring(4, 7);
            }
            if (value.length >= 7) {
                formattedValue += '-' + value.substring(7, 9);
            }
            if (value.length >= 9) {
                formattedValue += '-' + value.substring(9, 11);
            }
            
            this.value = formattedValue;
        });
    }
    
    // Заполнение списка заявок в личном кабинете
    if (window.location.pathname.split('/').pop() === 'dashboard.html') {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const orders = getOrders();
        const userOrders = orders.filter(order => order.user.login === currentUser.login);
        
        const ordersList = document.querySelector('.orders-list');
        if (ordersList && userOrders.length > 0) {
            ordersList.innerHTML = userOrders.map(order => `
                <div class="order-card">
                    <h3>Заявка #${order.id}</h3>
                    <p><strong>Дата:</strong> ${new Date(order.date).toLocaleString()}</p>
                    <p><strong>Груз:</strong> ${order.cargoType} (${order.cargoWeight} кг), ${order.cargoDimensions}</p>
                    <p><strong>Откуда:</strong> ${order.fromAddress}</p>
                    <p><strong>Куда:</strong> ${order.toAddress}</p>
                    <p><strong>Статус:</strong> ${order.status === 'pending' ? 'На рассмотрении' : 
                                              order.status === 'approved' ? 'Подтверждена' : 'Отклонена'}</p>
                </div>
            `).join('');
        } else if (ordersList) {
            ordersList.innerHTML = '<p>У вас пока нет заявок</p>';
        }
    }
    
    // Заполнение списка заявок в админ-панели
    if (window.location.pathname.split('/').pop() === 'admin.html') {
        const orders = getOrders();
        const ordersList = document.querySelector('.orders-list');
        
        if (ordersList && orders.length > 0) {
            ordersList.innerHTML = orders.map(order => `
                <div class="order-card admin">
                    <h3>Заявка #${order.id} от ${order.user.fullName}</h3>
                    <p><strong>Контакт:</strong> ${order.user.phone}, ${order.user.email}</p>
                    <p><strong>Дата:</strong> ${new Date(order.date).toLocaleString()}</p>
                    <p><strong>Груз:</strong> ${order.cargoType} (${order.cargoWeight} кг), ${order.cargoDimensions}</p>
                    <p><strong>Откуда:</strong> ${order.fromAddress}</p>
                    <p><strong>Куда:</strong> ${order.toAddress}</p>
                    <p><strong>Статус:</strong> ${order.status === 'pending' ? 'На рассмотрении' : 
                                              order.status === 'approved' ? 'Подтверждена' : 'Отклонена'}</p>
                    <div class="admin-actions">
                        <button class="btn btn-approve" data-id="${order.id}" ${order.status === 'approved' ? 'disabled' : ''}>Подтвердить</button>
                        <button class="btn btn-reject" data-id="${order.id}" ${order.status === 'rejected' ? 'disabled' : ''}>Отклонить</button>
                        <button class="btn btn-delete" data-id="${order.id}">Удалить</button>
                    </div>
                </div>
            `).join('');
        } else if (ordersList) {
            ordersList.innerHTML = '<p>Нет заявок</p>';
        }
        
        // Обработка действий администратора
        document.querySelectorAll('.btn-approve').forEach(btn => {
            btn.addEventListener('click', function() {
                const orderId = parseInt(this.getAttribute('data-id'));
                const orders = getOrders();
                const orderIndex = orders.findIndex(o => o.id === orderId);
                
                if (orderIndex !== -1) {
                    orders[orderIndex].status = 'approved';
                    saveOrders(orders);
                    alert('Заявка подтверждена');
                    window.location.reload();
                }
            });
        });
        
        document.querySelectorAll('.btn-reject').forEach(btn => {
            btn.addEventListener('click', function() {
                const orderId = parseInt(this.getAttribute('data-id'));
                const orders = getOrders();
                const orderIndex = orders.findIndex(o => o.id === orderId);
                
                if (orderIndex !== -1) {
                    orders[orderIndex].status = 'rejected';
                    saveOrders(orders);
                    alert('Заявка отклонена');
                    window.location.reload();
                }
            });
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const orderId = parseInt(this.getAttribute('data-id'));
                const orders = getOrders();
                const filteredOrders = orders.filter(o => o.id !== orderId);
                
                saveOrders(filteredOrders);
                alert('Заявка удалена');
                window.location.reload();
            });
        });
    }
});