const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

function initAdmin() {
    if (sessionStorage.getItem('admin_session') === 'true') {
        showDashboard();
    }
    
    document.getElementById('adminLoginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        adminLogin();
    });
}

function adminLogin() {
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value.trim();
    const messageEl = document.getElementById('adminLoginMessage');
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        sessionStorage.setItem('admin_session', 'true');
        showMessage(messageEl, '✅ Admin login successful!', 'success');
        setTimeout(() => showDashboard(), 500);
    } else {
        showMessage(messageEl, '❌ Invalid admin credentials!', 'error');
    }
}

function showDashboard() {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    loadAdminData();
}

function adminLogout() {
    sessionStorage.removeItem('admin_session');
    document.getElementById('adminLogin').style.display = 'block';
    document.getElementById('adminDashboard').style.display = 'none';
}

function loadAdminData() {
    const users = JSON.parse(localStorage.getItem('ludo_users')) || [];
    const games = JSON.parse(localStorage.getItem('ludo_games')) || [];
    
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('totalCoins').textContent = users.reduce((sum, u) => sum + (u.coins || 0), 0);
    document.getElementById('totalGames').textContent = games.length;
    
    const tbody = document.getElementById('userTableBody');
    const userList = document.getElementById('userList');
    tbody.innerHTML = '';
    userList.innerHTML = '';
    
    users.forEach((user, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${user.username}</strong></td>
            <td>${user.wid || 'N/A'}</td>
            <td>💰 ${user.coins || 0}</td>
            <td><span class="status-badge ${user.isAdmin ? 'admin' : 'active'}">${user.isAdmin ? '👑 Admin' : '✅ Active'}</span></td>
        `;
        tbody.appendChild(tr);
        
        const option = document.createElement('option');
        option.value = user.username;
        userList.appendChild(option);
    });
}

function adminUpdateCoins() {
    const username = document.getElementById('adminUserSelect').value.trim();
    const action = document.getElementById('coinAction').value;
    const amount = parseInt(document.getElementById('adminCoinAmount').value);
    const messageEl = document.getElementById('adminCoinMessage');
    
    if (!username || isNaN(amount) || amount <= 0) {
        showMessage(messageEl, 'Please enter valid username and amount', 'error');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('ludo_users')) || [];
    const userIndex = users.findIndex(u => u.username === username);
    
    if (userIndex === -1) {
        showMessage(messageEl, '❌ User not found!', 'error');
        return;
    }
    
    let newCoins = users[userIndex].coins || 0;
    let actionText = '';
    
    switch(action) {
        case 'add':
            newCoins += amount;
            actionText = `added ${amount} coins to`;
            break;
        case 'set':
            newCoins = amount;
            actionText = `set coins to ${amount} for`;
            break;
        case 'remove':
            newCoins = Math.max(0, newCoins - amount);
            actionText = `removed ${amount} coins from`;
            break;
    }
    
    users[userIndex].coins = newCoins;
    localStorage.setItem('ludo_users', JSON.stringify(users));
    
    showMessage(messageEl, `✅ Successfully ${actionText} ${username}. New balance: ${newCoins} coins`, 'success');
    loadAdminData();
    document.getElementById('adminCoinAmount').value = '';
}

function showMessage(el, text, type) {
    el.textContent = text;
    el.className = 'message ' + type;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 5000);
}

document.addEventListener('DOMContentLoaded', initAdmin);
