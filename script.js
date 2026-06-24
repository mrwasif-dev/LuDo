// ============================================
// LUDO KINGDOM - Complete Game Engine
// Original Ludo Flow with Full Mechanics
// ============================================

// ---------- DATA LAYER ----------
const DB = {
    users: JSON.parse(localStorage.getItem('ludo_users')) || [],
    games: JSON.parse(localStorage.getItem('ludo_games')) || [],
    currentUser: null,
    currentGame: null,
    gameMode: 'online',
    isRolling: false,
    gameHistory: [],
    turn: 0,
    players: [],
    tokens: {},
    winners: [],
    gameStarted: false
};

// ---------- AUTHENTICATION ----------
function initAuth() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            document.getElementById(tab + 'Form').classList.add('active');
        });
    });

    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        loginUser();
    });

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
        wins: 0,
        isAdmin: DB.users.length === 0,
        createdAt: new Date().toISOString()
    };

    DB.users.push(newUser);
    localStorage.setItem('ludo_users', JSON.stringify(DB.users));
    
    showMessage(messageEl, 'Account created successfully! Please login.', 'success');
    
    document.getElementById('signupUsername').value = '';
    document.getElementById('signupPassword').value = '';
    document.getElementById('signupWid').value = '';
    
    document.querySelector('.tab-btn[data-tab="login"]').click();
}

function showMessage(el, text, type) {
    el.textContent = text;
    el.className = 'message ' + type;
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
    const session = localStorage.getItem('ludo_session');
    if (!session) {
        window.location.href = 'index.html';
        return;
    }

    DB.currentUser = JSON.parse(session);
    
    document.getElementById('currentUser').textContent = DB.currentUser.username;
    document.getElementById('userWid').textContent = DB.currentUser.wid;
    document.getElementById('userCoins').textContent = DB.currentUser.coins;
    document.getElementById('userWins').textContent = DB.currentUser.wins || 0;

    initializeBoard();
    updatePlayersList();
    updateGameStatus('🎲 Select a game mode and start playing!');
    addHistory('Welcome to Ludo Kingdom!');
}

function initializeBoard() {
    const board = document.getElementById('ludoBoard');
    board.innerHTML = '';
    
    // Create 15x15 grid for classic Ludo board
    for (let i = 0; i < 225; i++) {
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        cell.dataset.index = i;
        
        // Define special cells
        const row = Math.floor(i / 15);
        const col = i % 15;
        
        // Home columns (center)
        if (row >= 6 && row <= 8 && col >= 6 && col <= 8) {
            cell.classList.add('home');
        }
        
        // Start positions
        if ((row === 0 && col === 0) || (row === 0 && col === 14) || 
            (row === 14 && col === 0) || (row === 14 && col === 14)) {
            cell.classList.add('start');
        }
        
        // Safe spots
        const safeSpots = [0, 14, 210, 224, 7, 15, 209, 217];
        if (safeSpots.includes(i)) {
            cell.classList.add('safe');
        }
        
        board.appendChild(cell);
    }
}

// ---------- GAME MODES ----------
function selectMode(mode) {
    DB.gameMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    const modeNames = {
        online: '🌐 Online Multiplayer',
        computer: '💻 vs Computer',
        local: '🏠 Local Game',
        private: '🔒 Private Game'
    };
    
    updateGameStatus(`Mode selected: ${modeNames[mode]}`);
    addHistory(`Game mode set to ${modeNames[mode]}`);
    
    // Initialize game based on mode
    DB.players = [DB.currentUser.username];
    DB.tokens = {};
    DB.winners = [];
    DB.gameStarted = false;
    DB.turn = 0;
    
    if (mode === 'computer') {
        DB.players.push('Computer');
        updateGameStatus('🤖 Playing against Computer! Roll the dice.');
    } else if (mode === 'online') {
        findOnlineMatch();
    } else if (mode === 'private') {
        updateGameStatus('🔒 Private game created. Share code with friends.');
    }
    
    updatePlayersList();
}

function findOnlineMatch() {
    updateGameStatus('🔍 Searching for opponent...');
    addHistory('Searching for online match...');
    
    setTimeout(() => {
        const opponent = DB.users.find(u => u.username !== DB.currentUser.username);
        if (opponent) {
            DB.players.push(opponent.username);
            updateGameStatus(`✅ Match found with ${opponent.username}!`);
            addHistory(`Matched with ${opponent.username}`);
            updatePlayersList();
        } else {
            updateGameStatus('⏳ No opponents available. Playing with AI...');
            DB.gameMode = 'computer';
            document.querySelector('.mode-btn[data-mode="computer"]')?.classList.add('active');
            document.querySelector('.mode-btn[data-mode="online"]')?.classList.remove('active');
            DB.players.push('Computer');
            updatePlayersList();
        }
        DB.gameStarted = true;
        updateTurnIndicator();
    }, 2000);
}

// ---------- ORIGINAL LUDO FLOW ----------
function rollDice() {
    if (DB.isRolling) return;
    if (!DB.gameStarted && DB.gameMode !== 'local') {
        updateGameStatus('⏳ Waiting for game to start...');
        return;
    }
    
    DB.isRolling = true;
    const rollBtn = document.getElementById('rollBtn');
    rollBtn.disabled = true;
    
    // Animate dice roll
    const diceDisplay = document.getElementById('diceResult');
    diceDisplay.classList.add('rolling');
    
    let count = 0;
    const interval = setInterval(() => {
        const value = Math.floor(Math.random() * 6) + 1;
        diceDisplay.textContent = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][value - 1];
        count++;
        if (count > 15) {
            clearInterval(interval);
            diceDisplay.classList.remove('rolling');
            
            const finalValue = Math.floor(Math.random() * 6) + 1;
            diceDisplay.textContent = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][finalValue - 1];
            
            // Process the roll
            processRoll(finalValue);
            
            DB.isRolling = false;
            rollBtn.disabled = false;
        }
    }, 80);
}

function processRoll(value) {
    const currentPlayer = DB.players[DB.turn % DB.players.length];
    addHistory(`${currentPlayer} rolled ${value}`);
    
    // Check for 6 (extra turn in original Ludo)
    if (value === 6) {
        updateGameStatus(`🎉 ${currentPlayer} rolled 6! Extra turn!`);
        addHistory(`${currentPlayer} gets another turn!`);
        // In original Ludo, 6 gives another turn
        // We'll implement this by not switching turn
        moveToken(currentPlayer, value);
        
        // If not game over, give extra turn
        if (!checkGameOver()) {
            setTimeout(() => {
                updateTurnIndicator();
                if (DB.gameMode === 'computer' && currentPlayer === 'Computer') {
                    computerTurn();
                }
            }, 500);
        }
    } else {
        moveToken(currentPlayer, value);
        
        // Switch turn after move
        if (!checkGameOver()) {
            setTimeout(() => {
                DB.turn++;
                updateTurnIndicator();
                if (DB.gameMode === 'computer' && DB.players[DB.turn % DB.players.length] === 'Computer') {
                    computerTurn();
                }
            }, 500);
        }
    }
    
    // Update UI
    updatePlayersList();
    updateGameStatus(`🎲 ${currentPlayer} rolled ${value}`);
}

function moveToken(player, steps) {
    // Get player's token position
    if (!DB.tokens[player]) {
        DB.tokens[player] = 0;
    }
    
    // Move token forward (simplified)
    DB.tokens[player] = (DB.tokens[player] + steps) % 52;
    
    // Check if token reached home (simplified)
    if (DB.tokens[player] >= 50 && !DB.winners.includes(player)) {
        DB.winners.push(player);
        addHistory(`🏆 ${player} reached home!`);
        updateGameStatus(`🏆 ${player} wins!`);
        
        // Reward coins
        if (player === DB.currentUser.username) {
            const reward = 50;
            updateUserCoins(reward);
            addHistory(`💰 ${player} earned ${reward} coins!`);
        }
        
        checkGameOver();
    }
    
    // Update board visualization
    updateBoard();
}

function updateBoard() {
    const cells = document.querySelectorAll('.board-cell');
    cells.forEach(cell => {
        cell.innerHTML = '';
    });
    
    // Place tokens on board
    for (const [player, position] of Object.entries(DB.tokens)) {
        if (position < 225) {
            const cell = cells[position];
            if (cell) {
                const token = document.createElement('div');
                token.className = `token ${player === 'Computer' ? 'computer' : 'player'}`;
                token.textContent = player === DB.currentUser?.username ? '👤' : '🤖';
                token.title = player;
                cell.appendChild(token);
            }
        }
    }
}

function checkGameOver() {
    const totalPlayers = DB.players.length;
    if (DB.winners.length >= totalPlayers - 1 || DB.winners.length >= totalPlayers) {
        showGameOver();
        return true;
    }
    return false;
}

function showGameOver() {
    const modal = document.getElementById('gameOverModal');
    const winner = DB.winners[0] || 'Nobody';
    document.getElementById('winnerMessage').textContent = `🏆 ${winner} wins the game!`;
    document.getElementById('coinsEarned').textContent = `+${DB.winners.includes(DB.currentUser.username) ? 50 : 0}`;
    document.getElementById('totalCoinsEarned').textContent = DB.currentUser.coins;
    modal.classList.add('active');
    addHistory(`Game Over! ${winner} wins!`);
}

function restartGame() {
    closeModal();
    DB.tokens = {};
    DB.winners = [];
    DB.turn = 0;
    DB.gameStarted = true;
    updateBoard();
    updatePlayersList();
    updateGameStatus('🔄 New game started! Roll the dice.');
    addHistory('New game started');
    updateTurnIndicator();
}

function closeModal() {
    document.getElementById('gameOverModal').classList.remove('active');
}

// ---------- COMPUTER AI ----------
function computerTurn() {
    if (DB.gameMode !== 'computer') return;
    if (DB.winners.length > 0) return;
    
    setTimeout(() => {
        const value = Math.floor(Math.random() * 6) + 1;
        document.getElementById('diceResult').textContent = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][value - 1];
        addHistory(`🤖 Computer rolled ${value}`);
        
        // Move computer token
        moveToken('Computer', value);
        
        if (value === 6 && !checkGameOver()) {
            // Extra turn for computer
            setTimeout(() => computerTurn(), 800);
        } else if (!checkGameOver()) {
            DB.turn++;
            updateTurnIndicator();
        }
        
        updateGameStatus(`🤖 Computer rolled ${value}`);
        updatePlayersList();
        
        // Enable roll button for player
        document.getElementById('rollBtn').disabled = false;
    }, 1000);
}

// ---------- UI UPDATES ----------
function updatePlayersList() {
    const container = document.getElementById('playerItems');
    if (!container) return;
    
    const colors = ['#e74c3c', '#2ecc71', '#3498db', '#f1c40f'];
    const currentTurn = DB.players[DB.turn % DB.players.length];
    
    container.innerHTML = DB.players.map((p, i) => `
        <div class="player-item">
            <span class="player-name">
                <span class="player-color" style="background:${colors[i % colors.length]}"></span>
                ${p} ${p === DB.currentUser?.username ? '👑' : ''}
                ${DB.winners.includes(p) ? '🏆' : ''}
            </span>
            <span class="player-status ${currentTurn === p ? 'active' : DB.winners.includes(p) ? 'winner' : 'waiting'}">
                ${currentTurn === p ? '● Playing' : DB.winners.includes(p) ? '🏆 Winner' : '○ Waiting'}
            </span>
        </div>
    `).join('');
}

function updateTurnIndicator() {
    const indicator = document.getElementById('turnIndicator');
    const currentPlayer = DB.players[DB.turn % DB.players.length];
    if (indicator) {
        indicator.innerHTML = currentPlayer === DB.currentUser?.username ?
            `<span class="active-turn">🎯 Your turn! Roll the dice.</span>` :
            `<span>⏳ ${currentPlayer}'s turn...</span>`;
    }
    
    // Disable roll button if not player's turn (unless computer mode)
    const rollBtn = document.getElementById('rollBtn');
    if (DB.gameMode === 'computer' && currentPlayer === 'Computer') {
        rollBtn.disabled = true;
    } else if (currentPlayer !== DB.currentUser?.username && DB.gameMode !== 'local') {
        rollBtn.disabled = true;
    } else {
        rollBtn.disabled = false;
    }
}

function updateGameStatus(message) {
    const el = document.getElementById('gameStatus');
    if (el) el.textContent = message;
}

function addHistory(message) {
    const log = document.getElementById('historyLog');
    if (!log) return;
    
    const entry = document.createElement('div');
    entry.className = 'history-entry';
    const time = new Date().toLocaleTimeString();
    entry.innerHTML = `<span class="highlight">${time}</span> - ${message}`;
    log.prepend(entry);
    
    // Limit history
    while (log.children.length > 50) {
        log.removeChild(log.lastChild);
    }
}

function updateUserCoins(amount) {
    if (!DB.currentUser) return;
    DB.currentUser.coins += amount;
    
    const userIndex = DB.users.findIndex(u => u.id === DB.currentUser.id);
    if (userIndex !== -1) {
        DB.users[userIndex].coins = DB.currentUser.coins;
        localStorage.setItem('ludo_users', JSON.stringify(DB.users));
        localStorage.setItem('ludo_session', JSON.stringify(DB.currentUser));
    }
    
    document.getElementById('userCoins').textContent = DB.currentUser.coins;
}

// ---------- COMPUTER AI (continued) ----------
// (This is now handled above)

// ---------- EVENT LISTENERS ----------
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('game.html')) {
        initGame();
    } else if (window.location.pathname.includes('admin.html')) {
        // Admin page has its own JS
    } else {
        initAuth();
    }
});

// ---------- EXPOSE FOR INLINE HTML ----------
window.loginUser = loginUser;
window.signupUser = signupUser;
window.logout = logout;
window.selectMode = selectMode;
window.rollDice = rollDice;
window.restartGame = restartGame;
window.closeModal = closeModal;
window.findOnlineMatch = findOnlineMatch;
