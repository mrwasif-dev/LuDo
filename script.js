// ============================================
// LUDO KINGDOM - Complete Game Engine
// Professional Implementation
// ============================================

// ---------- DATA LAYER ----------
const DB = {
    users: JSON.parse(localStorage.getItem('ludo_users')) || [],
    games: JSON.parse(localStorage.getItem('ludo_games')) || [],
    currentUser: null,
    currentGame: null,
    gameMode: 'online',
    isRolling: false
};

// ---------- AUTHENTICATION ----------
function initAuth() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            document.getElementById(tab + 'Form').classList.add('active');
        });
    });

    // Login handler
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        loginUser();
    });

    // Signup handler
    document.getElementById('signupForm').addEventListener('submit', function(e) {
        e.preventDefault();
        signupUser();
    });
}

function loginUser() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const messageEl = document.getElementById('loginMessage');

    if (!username || !password) {
        showMessage(messageEl, 'Please fill in all fields', 'error');
        return;
    }

    const user = DB.users.find(u => u.username === username && u.password === password);
    
    if (!user) {
        showMessage(messageEl, 'Invalid username or password', 'error');
        return;
    }

    DB.currentUser = user;
    localStorage.setItem('ludo_session', JSON.stringify(user));
    showMessage(messageEl, 'Login successful! Redirecting...', 'success');
    
    setTimeout(() => {
        window.location.href = 'game.html';
    }, 1000);
}

function signupUser() {
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const wid = document.getElementById('signupWid').value.trim();
    const messageEl = document.getElementById('signupMessage');

    if (!username || !password || !wid) {
        showMessage(messageEl, 'Please fill in all fields', 'error');
        return;
    }

    if (DB.users.find(u => u.username === username)) {
        showMessage(messageEl, 'Username already exists', 'error');
        return;
    }

    if (DB.users.find(u => u.wid === wid)) {
        showMessage(messageEl, 'W_ID already registered', 'error');
        return;
    }

    const newUser = {
        id: Date.now().toString(),
        username,
        password,
        wid,
        coins: 100,
        isAdmin: username === 'admin' || DB.users.length === 0,
        createdAt: new Date().toISOString()
    };

    DB.users.push(newUser);
    localStorage.setItem('ludo_users', JSON.stringify(DB.users));
    
    showMessage(messageEl, 'Account created successfully! Please login.', 'success');
    
    // Clear form
    document.getElementById('signupUsername').value = '';
    document.getElementById('signupPassword').value = '';
    document.getElementById('signupWid').value = '';
    
    // Switch to login tab
    document.querySelector('.tab-btn[data-tab="login"]').click();
}

function showMessage(el, text, type) {
    el.textContent = text;
    el.className = 'message ' + type;
    el.style.display = 'block';
    setTimeout(() => {
        el.style.display = 'none';
    }, 5000);
}

function logout() {
    localStorage.removeItem('ludo_session');
    DB.currentUser = null;
    window.location.href = 'index.html';
}

// ---------- GAME INITIALIZATION ----------
function initGame() {
    // Check session
    const session = localStorage.getItem('ludo_session');
    if (!session) {
        window.location.href = 'index.html';
        return;
    }

    DB.currentUser = JSON.parse(session);
    
    // Update UI
    document.getElementById('currentUser').textContent = DB.currentUser.username;
    document.getElementById('userWid').textContent = DB.currentUser.wid;
    document.getElementById('userCoins').textContent = DB.currentUser.coins;

    // Show admin button if admin
    if (DB.currentUser.isAdmin) {
        document.getElementById('adminToggle').style.display = 'inline-block';
    }

    // Initialize board
    createBoard();
    updatePlayersList();
    updateGameStatus('Welcome! Select a mode and roll the dice.');
}

function createBoard() {
    const board = document.getElementById('ludoBoard');
    board.innerHTML = '';
    
    // Create 15x15 grid (simplified Ludo board)
    for (let i = 0; i < 225; i++) {
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        
        // Add some random styling for visual appeal
        if (i % 15 === 0 || i % 15 === 14 || i < 15 || i > 209) {
            cell.classList.add('home');
        }
        
        cell.dataset.index = i;
        board.appendChild(cell);
    }
}

// ---------- GAME LOGIC ----------
function selectMode(mode) {
    DB.gameMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    const modeNames = {
        online: 'Online Multiplayer',
        computer: 'vs Computer',
        local: 'Local Game'
    };
    
    updateGameStatus(`Mode: ${modeNames[mode]}. Ready to play!`);
    
    // Reset game state
    DB.currentGame = {
        mode: mode,
        players: [DB.currentUser.username],
        currentTurn: 0,
        diceValue: 0,
        status: 'waiting'
    };
    
    updatePlayersList();
}

function rollDice() {
    if (DB.isRolling) return;
    DB.isRolling = true;
    
    const rollBtn = document.getElementById('rollBtn');
    rollBtn.disabled = true;
    
    // Animate dice roll
    let count = 0;
    const interval = setInterval(() => {
        const value = Math.floor(Math.random() * 6) + 1;
        document.getElementById('diceResult').textContent = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][value - 1];
        count++;
        if (count > 10) {
            clearInterval(interval);
            const finalValue = Math.floor(Math.random() * 6) + 1;
            document.getElementById('diceResult').textContent = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][finalValue - 1];
            
            // Update game state
            if (DB.currentGame) {
                DB.currentGame.diceValue = finalValue;
                DB.currentGame.currentTurn = (DB.currentGame.currentTurn + 1) % 2;
                updateGameStatus(`🎲 Rolled ${finalValue}! Turn: ${DB.currentGame.currentTurn === 0 ? 'Player 1' : 'Player 2'}`);
                
                // Update coins (mini reward system)
                updateCoinsReward(finalValue);
            }
            
            DB.isRolling = false;
            rollBtn.disabled = false;
        }
    }, 100);
}

function updateCoinsReward(diceValue) {
    // Random coin reward system
    const reward = Math.floor(Math.random() * 5) + 1;
    if (diceValue === 6) {
        const bonus = Math.floor(Math.random() * 10) + 5;
        updateUserCoins(reward + bonus);
        updateGameStatus(`🎉 Lucky 6! +${reward + bonus} coins bonus!`);
    } else {
        updateUserCoins(reward);
        updateGameStatus(`+${reward} coins earned!`);
    }
}

function updateUserCoins(amount) {
    if (!DB.currentUser) return;
    DB.currentUser.coins += amount;
    
    // Update in DB
    const userIndex = DB.users.findIndex(u => u.id === DB.currentUser.id);
    if (userIndex !== -1) {
        DB.users[userIndex].coins = DB.currentUser.coins;
        localStorage.setItem('ludo_users', JSON.stringify(DB.users));
        localStorage.setItem('ludo_session', JSON.stringify(DB.currentUser));
    }
    
    document.getElementById('userCoins').textContent = DB.currentUser.coins;
}

function updatePlayersList() {
    const container = document.getElementById('playerItems');
    if (!container) return;
    
    const players = DB.currentGame ? 
        DB.currentGame.players : 
        [DB.currentUser ? DB.currentUser.username : 'Guest'];
    
    container.innerHTML = players.map((p, i) => `
        <div class="player-item">
            <span class="player-name">${p} ${i === 0 ? '👑' : ''}</span>
            <span class="player-status ${i === DB.currentGame?.currentTurn ? 'active' : 'waiting'}">
                ${i === DB.currentGame?.currentTurn ? '● Playing' : '○ Waiting'}
            </span>
        </div>
    `).join('');
}

function updateGameStatus(message) {
    const el = document.getElementById('gameStatus');
    if (el) el.textContent = message;
}

// ---------- ADMIN FUNCTIONS ----------
function toggleAdmin() {
    const panel = document.getElementById('adminPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function updateCoins() {
    const username = document.getElementById('adminUsername').value.trim();
    const coins = parseInt(document.getElementById('adminCoins').value);
    const messageEl = document.getElementById('adminMessage');

    if (!username || isNaN(coins)) {
        showMessage(messageEl, 'Please enter valid username and coins', 'error');
        return;
    }

    const user = DB.users.find(u => u.username === username);
    if (!user) {
        showMessage(messageEl, 'User not found', 'error');
        return;
    }

    user.coins = coins;
    localStorage.setItem('ludo_users', JSON.stringify(DB.users));
    
    // Update current user if it's them
    if (DB.currentUser && DB.currentUser.username === username) {
        DB.currentUser.coins = coins;
        localStorage.setItem('ludo_session', JSON.stringify(DB.currentUser));
        document.getElementById('userCoins').textContent = coins;
    }

    showMessage(messageEl, `✅ ${username} now has ${coins} coins`, 'success');
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminCoins').value = '';
}

// ---------- COMPUTER AI (Simple) ----------
function computerTurn() {
    if (DB.gameMode !== 'computer') return;
    
    setTimeout(() => {
        const value = Math.floor(Math.random() * 6) + 1;
        document.getElementById('diceResult').textContent = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][value - 1];
        updateGameStatus(`🤖 Computer rolled ${value}`);
        
        // Simple AI logic - computer gets coins too
        updateUserCoins(Math.floor(Math.random() * 3) + 1);
    }, 1500);
}

// ---------- ONLINE MATCHMAKING (Simulated) ----------
function findOnlineMatch() {
    updateGameStatus('🔍 Searching for opponent...');
    
    setTimeout(() => {
        const opponent = DB.users.find(u => u.username !== DB.currentUser.username);
        if (opponent) {
            updateGameStatus(`✅ Match found with ${opponent.username}!`);
            if (DB.currentGame) {
                DB.currentGame.players = [DB.currentUser.username, opponent.username];
                updatePlayersList();
            }
        } else {
            updateGameStatus('⏳ No opponents available. Playing with AI...');
            DB.gameMode = 'computer';
            document.querySelector('.mode-btn[data-mode="computer"]')?.classList.add('active');
            document.querySelector('.mode-btn[data-mode="online"]')?.classList.remove('active');
        }
    }, 2000);
}

// ---------- EVENT LISTENERS ----------
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('game.html')) {
        initGame();
        // Auto-start online matchmaking
        setTimeout(() => {
            if (DB.gameMode === 'online') {
                findOnlineMatch();
            }
        }, 1000);
    } else {
        initAuth();
    }
});

// ---------- UTILITY FUNCTIONS ----------
function getDiceEmoji(value) {
    return ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][value - 1] || '🎲';
}

// ---------- EXPOSE FOR INLINE HTML ----------
window.loginUser = loginUser;
window.signupUser = signupUser;
window.logout = logout;
window.selectMode = selectMode;
window.rollDice = rollDice;
window.toggleAdmin = toggleAdmin;
window.updateCoins = updateCoins;
window.computerTurn = computerTurn;
window.findOnlineMatch = findOnlineMatch;
