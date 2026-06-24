// ============================================
// LUDO KINGDOM - Admin Panel
// Secure Administration Interface
// ============================================

// ---------- ADMIN AUTH ----------
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'  // Change this in production!
};

function initAdmin() {
    // Check if already logged in
    const adminSession = sessionStorage.getItem('admin_session');
    if (adminSession === 'true') {
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
    document.getElementById('adminName').textContent = ADMIN_CREDENTIALS.username;
    loadAdminData();
}

function adminLogout() {
    sessionStorage.removeItem('admin_session');
    document.getElementById('adminLogin').style.display = 'block';
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';
}

function loadAdminData() {
    const users = JSON.parse(localStorage.getItem('ludo_users')) || [];
    const games = JSON.parse(localStorage.getItem('ludo_games')) || [];
    
    // Update stats
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('totalCoins').textContent = users.reduce((sum, u) => sum + (u.coins || 0), 0);
    document.getElementById('totalGames').textContent = games.length || 0;
    document.getElementById('activeGames').textContent = games.filter(g => g.status === 'active').length || 0;
    document.getElementById('completedGames').textContent = games.filter(g => g.status === 'completed').length || 0;
    document.getElementById('onlinePlayers').textContent = users.filter(u => u.online).length || 0;
    
    // Update user table
    const tbody = document.getElementById('userTableBody');
    const userList = document.getElementById('userList');
    tbody.innerHTML = '';
    userList.innerHTML = '';
    
    users.forEach((user, index) => {
        // Add to table
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${user.username}</strong></td>
            <td>${user.wid || 'N/A'}</td>
            <td>💰 ${user.coins || 0}</td>
            <td><span class="status-badge ${user.isAdmin ? 'admin' : 'active'}">${user.isAdmin ? '👑 Admin' : '✅ Active'}</span></td>
            <td>
                <button class="btn-primary" style="padding:4px 12px;font-size:12px;width:auto;" onclick="quickEditUser('${user.username}')">✏️ Edit</button>
            </td>
        `;
        tbody.appendChild(tr);
        
        // Add to datalist
        const option = document.createElement('option');
        option.value = user.username;
        userList.appendChild(option);
    });
}

// ---------- ADMIN COIN MANAGEMENT ----------
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
    
    // Update UI
    loadAdminData();
    document.getElementById('adminCoinAmount').value = '';
    document.getElementById('adminUserSelect').value = '';
}

function quickEditUser(username) {
    document.getElementById('adminUserSelect').value = username;
    document.getElementById('adminCoinAmount').focus();
    document.getElementById('adminCoinMessage').textContent = '';
    document.getElementById('adminCoinMessage').className = 'message';
    
    // Scroll to coin management
    document.querySelector('.admin-card h3').scrollIntoView({ behavior: 'smooth' });
}

// ---------- UTILITY ----------
function showMessage(el, text, type) {
    el.textContent = text;
    el.className = 'message ' + type;
}

// ---------- EXPOSE ----------
window.adminLogin = adminLogin;
window.adminLogout = adminLogout;
window.adminUpdateCoins = adminUpdateCoins;
window.quickEditUser = quickEditUser;

// Init on load
document.addEventListener('DOMContentLoaded', initAdmin);
