// ============================================
// 🎲 LUDO KINGDOM - COMPLETE ORIGINAL GAME
// Full Ludo Board Game Implementation
// ============================================

// ---------- GAME CONSTANTS ----------
const LUDO = {
    BOARD_SIZE: 15,
    TOTAL_CELLS: 225,
    PLAYER_COLORS: ['#e74c3c', '#2ecc71', '#3498db', '#f1c40f'],
    PLAYER_NAMES: ['Red', 'Green', 'Blue', 'Yellow'],
    TOKEN_COUNT: 4,
    HOME_POSITIONS: [
        [0, 0],   // Red - top left
        [0, 14],  // Green - top right
        [14, 0],  // Blue - bottom left
        [14, 14]  // Yellow - bottom right
    ],
    SAFE_SPOTS: [0, 7, 14, 105, 119, 210, 217, 224],
    STAR_SPOTS: [7, 15, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 91, 98, 
                 105, 112, 119, 126, 133, 140, 147, 154, 161, 168, 175, 
                 182, 189, 196, 203, 210, 217]
};

// ---------- DATA LAYER ----------
const DB = {
    users: JSON.parse(localStorage.getItem('ludo_users')) || [],
    games: JSON.parse(localStorage.getItem('ludo_games')) || [],
    currentUser: null,
    currentGame: null,
    gameMode: '2player',
    isRolling: false,
    gameHistory: [],
    turn: 0,
    players: [],
    tokens: {},
    winners: [],
    gameStarted: false,
    diceHistory: [],
    moveHistory: []
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
    updateGameStatus('🎲 Select game mode and start playing!');
    addHistory('Welcome to Ludo Kingdom!');
    updateTurnIndicator();
}

function initializeBoard() {
    const board = document.getElementById('ludoBoard');
    board.innerHTML = '';
    
    for (let i = 0; i < LUDO.TOTAL_CELLS; i++) {
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        cell.dataset.index = i;
        
        const row = Math.floor(i / LUDO.BOARD_SIZE);
        const col = i % LUDO.BOARD_SIZE;
        
        // Home positions
        if (row >= 6 && row <= 8 && col >= 6 && col <= 8) {
            cell.classList.add('home');
            cell.textContent = '⭐';
        }
        
        // Safe spots
        if (LUDO.SAFE_SPOTS.includes(i)) {
            cell.classList.add('safe');
            cell.textContent = '🛡️';
        }
        
        // Star spots
        if (LUDO.STAR_SPOTS.includes(i)) {
            cell.classList.add('star');
            cell.textContent = '✦';
        }
        
        // Player home bases
        if (row < 6 && col < 6) {
            cell.style.background = 'rgba(231, 76, 60, 0.1)';
        } else if (row < 6 && col > 8) {
            cell.style.background = 'rgba(46, 204, 113, 0.1)';
        } else if (row > 8 && col < 6) {
            cell.style.background = 'rgba(52, 152, 219, 0.1)';
        } else if (row > 8 && col > 8) {
            cell.style.background = 'rgba(241, 196, 15, 0.1)';
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
        '2player': '👥 2 Players',
        '4player': '👥👥 4 Players',
        'computer': '💻 vs Computer',
        'online': '🌐 Online'
    };
    
    // Initialize players based on mode
    DB.players = [DB.currentUser.username];
    DB.tokens = {};
    DB.winners = [];
    DB.gameStarted = false;
    DB.turn = 0;
    DB.moveHistory = [];
    DB.diceHistory = [];
    
    if (mode === '2player') {
        DB.players.push('Player 2');
        updateGameStatus('👥 2 Player game started! Roll the dice.');
    } else if (mode === '4player') {
        DB.players.push('Player 2', 'Player 3', 'Player 4');
        updateGameStatus('👥👥 4 Player game started! Roll the dice.');
    } else if (mode === 'computer') {
        DB.players.push('Computer');
        updateGameStatus('💻 Playing against Computer! Roll the dice.');
    } else if (mode === 'online') {
        findOnlineMatch();
        return;
    }
    
    // Initialize tokens for all players
    DB.players.forEach((player, index) => {
        DB.tokens[player] = {
            positions: [0, 0, 0, 0], // 4 tokens at position 0
            home: [false, false, false, false],
            finished: [false, false, false, false],
            color: LUDO.PLAYER_COLORS[index % LUDO.PLAYER_COLORS.length]
        };
    });
    
    DB.gameStarted = true;
    addHistory(`Game started: ${modeNames[mode]}`);
    updatePlayersList();
    updateTurnIndicator();
    renderBoard();
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
            initializeTokens();
            updatePlayersList();
            renderBoard();
        } else {
            updateGameStatus('⏳ No opponents available. Playing with AI...');
            DB.gameMode = 'computer';
            document.querySelector('.mode-btn[data-mode="computer"]')?.classList.add('active');
            document.querySelector('.mode-btn[data-mode="online"]')?.classList.remove('active');
            DB.players.push('Computer');
            initializeTokens();
            updatePlayersList();
            renderBoard();
        }
        DB.gameStarted = true;
        updateTurnIndicator();
    }, 2000);
}

function initializeTokens() {
    DB.players.forEach((player, index) => {
        DB.tokens[player] = {
            positions: [0, 0, 0, 0],
            home: [false, false, false, false],
            finished: [false, false, false, false],
            color: LUDO.PLAYER_COLORS[index % LUDO.PLAYER_COLORS.length]
        };
    });
}

// ---------- ORIGINAL LUDO ENGINE ----------
function rollDice() {
    if (DB.isRolling) return;
    if (!DB.gameStarted) {
        updateGameStatus('⏳ Please select a game mode first!');
        return;
    }
    
    const currentPlayer = DB.players[DB.turn % DB.players.length];
    
    // Check if it's this player's turn
    if (currentPlayer !== DB.currentUser.username && DB.gameMode !== 'local' && DB.gameMode !== 'computer') {
        updateGameStatus(`⏳ Waiting for ${currentPlayer}'s turn...`);
        return;
    }
    
    // Check if computer's turn
    if (DB.gameMode === 'computer' && currentPlayer === 'Computer') {
        return computerTurn();
    }
    
    DB.isRolling = true;
    const rollBtn = document.getElementById('rollBtn');
    rollBtn.disabled = true;
    
    const diceDisplay = document.getElementById('diceResult');
    diceDisplay.classList.add('rolling');
    
    let count = 0;
    const interval = setInterval(() => {
        const value = Math.floor(Math.random() * 6) + 1;
        diceDisplay.textContent = getDiceEmoji(value);
        count++;
        if (count > 12) {
            clearInterval(interval);
            diceDisplay.classList.remove('rolling');
            
            const finalValue = Math.floor(Math.random() * 6) + 1;
            diceDisplay.textContent = getDiceEmoji(finalValue);
            
            DB.diceHistory.push(finalValue);
            processRoll(currentPlayer, finalValue);
            
            DB.isRolling = false;
            rollBtn.disabled = false;
        }
    }, 80);
}

function getDiceEmoji(value) {
    return ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][value - 1];
}

function processRoll(player, value) {
    addHistory(`${player} rolled ${value}`);
    updateGameStatus(`🎲 ${player} rolled ${value}`);
    
    // Check if any token can move
    const canMove = canAnyTokenMove(player, value);
    
    if (!canMove) {
        addHistory(`${player} cannot move any token`);
        updateGameStatus(`⏳ ${player} cannot move. Turn passes.`);
        
        if (value !== 6) {
            setTimeout(() => {
                nextTurn();
            }, 800);
        } else {
            // Extra turn but can't move
            setTimeout(() => {
                updateGameStatus(`🎲 ${player} rolled 6 but can't move! Extra turn.`);
                setTimeout(() => {
                    if (!checkGameOver()) {
                        updateTurnIndicator();
                    }
                }, 500);
            }, 500);
        }
        return;
    }
    
    // Auto-move the first movable token
    const tokenIndex = getFirstMovableToken(player, value);
    if (tokenIndex !== -1) {
        moveToken(player, tokenIndex, value);
    }
}

function canAnyTokenMove(player, value) {
    const tokens = DB.tokens[player];
    if (!tokens) return false;
    
    for (let i = 0; i < 4; i++) {
        if (tokens.finished[i]) continue;
        
        // Token at home can only move on 6
        if (tokens.home[i] && value === 6) {
            return true;
        }
        
        // Token on board can move
        if (!tokens.home[i]) {
            const newPos = tokens.positions[i] + value;
            if (newPos <= 56) { // 56 = home
                return true;
            }
        }
    }
    return false;
}

function getFirstMovableToken(player, value) {
    const tokens = DB.tokens[player];
    if (!tokens) return -1;
    
    for (let i = 0; i < 4; i++) {
        if (tokens.finished[i]) continue;
        
        if (tokens.home[i] && value === 6) {
            return i;
        }
        
        if (!tokens.home[i]) {
            const newPos = tokens.positions[i] + value;
            if (newPos <= 56) {
                return i;
            }
        }
    }
    return -1;
}

function moveToken(player, tokenIndex, value) {
    const tokens = DB.tokens[player];
    
    // Token at home - bring out on 6
    if (tokens.home[tokenIndex] && value === 6) {
        tokens.home[tokenIndex] = false;
        tokens.positions[tokenIndex] = 1;
        addHistory(`${player} brought token ${tokenIndex + 1} out! 🎯`);
        updateGameStatus(`${player} brought token out!`);
        renderBoard();
        updatePlayersList();
        
        // Check for capture
        checkCapture(player, tokenIndex);
        
        // Extra turn for 6
        setTimeout(() => {
            if (!checkGameOver()) {
                updateGameStatus(`${player} gets another turn!`);
                updateTurnIndicator();
                if (DB.gameMode === 'computer' && player === 'Computer') {
                    setTimeout(() => computerTurn(), 500);
                }
            }
        }, 500);
        return;
    }
    
    // Move token on board
    if (!tokens.home[tokenIndex]) {
        const newPos = tokens.positions[tokenIndex] + value;
        
        // Check if reached home
        if (newPos >= 56) {
            tokens.finished[tokenIndex] = true;
            tokens.home[tokenIndex] = true;
            tokens.positions[tokenIndex] = 56;
            addHistory(`🏆 ${player} got token ${tokenIndex + 1} home!`);
            updateGameStatus(`🏆 ${player} got token home!`);
            
            // Check if all tokens home
            if (tokens.finished.every(f => f)) {
                DB.winners.push(player);
                addHistory(`🏆 ${player} wins the game!`);
                updateGameStatus(`🏆 ${player} wins!`);
                
                // Reward coins
                if (player === DB.currentUser.username) {
                    const reward = 50;
                    updateUserCoins(reward);
                    addHistory(`💰 ${player} earned ${reward} coins!`);
                }
                
                checkGameOver();
                renderBoard();
                updatePlayersList();
                return;
            }
        } else {
            tokens.positions[tokenIndex] = newPos;
            addHistory(`${player} moved token ${tokenIndex + 1} to position ${newPos}`);
            
            // Check for capture
            checkCapture(player, tokenIndex);
        }
        
        renderBoard();
        updatePlayersList();
        
        // Check if game over
        if (checkGameOver()) return;
        
        // Extra turn on 6
        if (value === 6) {
            setTimeout(() => {
                updateGameStatus(`${player} rolled 6! Extra turn!`);
                updateTurnIndicator();
                if (DB.gameMode === 'computer' && player === 'Computer') {
                    setTimeout(() => computerTurn(), 500);
                }
            }, 500);
        } else {
            setTimeout(() => {
                nextTurn();
            }, 800);
        }
    }
}

function checkCapture(player, tokenIndex) {
    const position = DB.tokens[player].positions[tokenIndex];
    if (position === 0) return;
    if (LUDO.SAFE_SPOTS.includes(position)) return;
    
    // Check all other players
    DB.players.forEach(otherPlayer => {
        if (otherPlayer === player) return;
        const otherTokens = DB.tokens[otherPlayer];
        if (!otherTokens) return;
        
        for (let i = 0; i < 4; i++) {
            if (otherTokens.finished[i]) continue;
            if (otherTokens.home[i]) continue;
            if (otherTokens.positions[i] === position) {
                // Capture!
                otherTokens.home[i] = true;
                otherTokens.positions[i] = 0;
                addHistory(`💥 ${player} captured ${otherPlayer}'s token!`);
                updateGameStatus(`💥 ${player} captured a token!`);
                renderBoard();
                updatePlayersList();
            }
        }
    });
}

function nextTurn() {
    DB.turn++;
    if (!checkGameOver()) {
        updateTurnIndicator();
        const currentPlayer = DB.players[DB.turn % DB.players.length];
        updateGameStatus(`⏳ ${currentPlayer}'s turn`);
        
        // Computer turn
        if (DB.gameMode === 'computer' && currentPlayer === 'Computer') {
            setTimeout(() => computerTurn(), 1000);
        }
    }
}

// ---------- COMPUTER AI ----------
function computerTurn() {
    if (DB.gameMode !== 'computer') return;
    if (DB.winners.length > 0) return;
    
    const player = 'Computer';
    const value = Math.floor(Math.random() * 6) + 1;
    document.getElementById('diceResult').textContent = getDiceEmoji(value);
    addHistory(`🤖 Computer rolled ${value}`);
    updateGameStatus(`🤖 Computer rolled ${value}`);
    
    // Simple AI - find best move
    const canMove = canAnyTokenMove(player, value);
    
    if (canMove) {
        // Find best token to move (prefer tokens closest to home)
        const tokens = DB.tokens[player];
        let bestToken = -1;
        let bestScore = -1;
        
        for (let i = 0; i < 4; i++) {
            if (tokens.finished[i]) continue;
            if (tokens.home[i] && value !== 6) continue;
            if (!tokens.home[i]) {
                const newPos = tokens.positions[i] + value;
                if (newPos <= 56) {
                    const score = newPos; // Prefer tokens further along
                    if (score > bestScore) {
                        bestScore = score;
                        bestToken = i;
                    }
                }
            } else if (value === 6) {
                // Bring token out if possible
                bestToken = i;
                break;
            }
        }
        
        if (bestToken !== -1) {
            moveToken(player, bestToken, value);
            if (value === 6 && !checkGameOver()) {
                setTimeout(() => computerTurn(), 800);
            }
            return;
        }
    }
    
    // If can't move or no good move, pass turn
    if (value !== 6) {
        setTimeout(() => {
            nextTurn();
        }, 800);
    } else {
        // Extra turn but can't move
        addHistory(`🤖 Computer rolled 6 but can't move`);
        setTimeout(() => {
            if (!checkGameOver()) {
                updateTurnIndicator();
                setTimeout(() => computerTurn(), 500);
            }
        }, 500);
    }
}

// ---------- BOARD RENDERING ----------
function renderBoard() {
    const cells = document.querySelectorAll('.board-cell');
    cells.forEach(cell => {
        cell.innerHTML = '';
        // Keep special indicators
        const index = parseInt(cell.dataset.index);
        if (LUDO.SAFE_SPOTS.includes(index)) {
            cell.textContent = '🛡️';
        } else if (LUDO.STAR_SPOTS.includes(index)) {
            cell.textContent = '✦';
        } else if (index >= 90 && index <= 134 && 
                   Math.floor(index / 15) >= 6 && Math.floor(index / 15) <= 8) {
            cell.textContent = '⭐';
        }
    });
    
    // Place tokens on board
    for (const [player, tokens] of Object.entries(DB.tokens)) {
        const color = tokens.color || '#888';
        for (let i = 0; i < 4; i++) {
            if (tokens.finished[i]) continue;
            if (tokens.home[i]) continue;
            
            const pos = tokens.positions[i];
            if (pos > 0 && pos < 225) {
                const cell = document.querySelector(`.board-cell[data-index="${pos}"]`);
                if (cell) {
                    const tokenEl = document.createElement('div');
                    tokenEl.className = `token ${player === DB.currentUser?.username ? 'player' : 'opponent'}`;
                    tokenEl.style.background = color;
                    tokenEl.textContent = player === DB.currentUser?.username ? '👤' : 
                                          player === 'Computer' ? '🤖' : '👥';
                    tokenEl.style.fontSize = '14px';
                    tokenEl.style.display = 'flex';
                    tokenEl.style.alignItems = 'center';
                    tokenEl.style.justifyContent = 'center';
                    tokenEl.style.color = '#fff';
                    tokenEl.style.fontWeight = 'bold';
                    tokenEl.style.textShadow = '0 1px 3px rgba(0,0,0,0.5)';
                    
                    // Remove previous text content
                    if (LUDO.SAFE_SPOTS.includes(pos) || LUDO.STAR_SPOTS.includes(pos)) {
                        cell.textContent = '';
                    }
                    cell.appendChild(tokenEl);
                }
            }
        }
    }
}

// ---------- UI UPDATES ----------
function updatePlayersList() {
    const container = document.getElementById('playerItems');
    if (!container) return;
    
    const currentTurn = DB.players[DB.turn % DB.players.length];
    
    container.innerHTML = DB.players.map((p, i) => {
        const tokens = DB.tokens[p];
        const finished = tokens ? tokens.finished.filter(f => f).length : 0;
        const color = tokens ? tokens.color : LUDO.PLAYER_COLORS[i % LUDO.PLAYER_COLORS.length];
        const isWinner = DB.winners.includes(p);
        
        return `
            <div class="player-item" style="border-left: 3px solid ${color}">
                <span class="player-name">
                    <span class="player-color" style="background:${color}"></span>
                    ${p} ${p === DB.currentUser?.username ? '👑' : ''}
                    ${isWinner ? '🏆' : ''}
                    <span style="font-size:11px;color:rgba(255,255,255,0.5);">
                        (${finished}/4)
                    </span>
                </span>
                <span class="player-status ${currentTurn === p ? 'active' : isWinner ? 'winner' : 'waiting'}">
                    ${currentTurn === p ? '● Playing' : isWinner ? '🏆 Winner' : '○ Waiting'}
                </span>
            </div>
        `;
    }).join('');
}

function updateTurnIndicator() {
    const indicator = document.getElementById('turnIndicator');
    const currentPlayer = DB.players[DB.turn % DB.players.length];
    
    if (indicator) {
        const isUserTurn = currentPlayer === DB.currentUser?.username;
        const isComputerTurn = currentPlayer === 'Computer';
        
        if (isUserTurn) {
            indicator.innerHTML = `<span class="active-turn">🎯 Your turn! Roll the dice.</span>`;
            document.getElementById('rollBtn').disabled = false;
        } else if (isComputerTurn) {
            indicator.innerHTML = `<span>🤖 Computer is thinking...</span>`;
            document.getElementById('rollBtn').disabled = true;
        } else {
            indicator.innerHTML = `<span>⏳ ${currentPlayer}'s turn...</span>`;
            document.getElementById('rollBtn').disabled = true;
        }
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
        if (amount > 0) {
            DB.users[userIndex].wins = (DB.users[userIndex].wins || 0) + 1;
            DB.currentUser.wins = DB.users[userIndex].wins;
        }
        localStorage.setItem('ludo_users', JSON.stringify(DB.users));
        localStorage.setItem('ludo_session', JSON.stringify(DB.currentUser));
    }
    
    document.getElementById('userCoins').textContent = DB.currentUser.coins;
    document.getElementById('userWins').textContent = DB.currentUser.wins || 0;
}

// ---------- GAME OVER ----------
function checkGameOver() {
    const totalPlayers = DB.players.length;
    if (DB.winners.length >= totalPlayers) {
        showGameOver();
        return true;
    }
    return false;
}

function showGameOver() {
    const modal = document.getElementById('gameOverModal');
    const winner = DB.winners[0] || 'Nobody';
    document.getElementById('winnerMessage').textContent = `🏆 ${winner} wins the game!`;
    document.getElementById('coinsEarned').textContent = `+${DB.winners.includes(DB.currentUser?.username) ? 50 : 0}`;
    document.getElementById('totalCoinsEarned').textContent = DB.currentUser?.coins || 0;
    modal.classList.add('active');
    addHistory(`Game Over! ${winner} wins!`);
    
    // Save game stats
    const gameStats = {
        winner: winner,
        players: DB.players,
        date: new Date().toISOString(),
        mode: DB.gameMode
    };
    DB.games.push(gameStats);
    localStorage.setItem('ludo_games', JSON.stringify(DB.games));
}

function restartGame() {
    closeModal();
    DB.tokens = {};
    DB.winners = [];
    DB.turn = 0;
    DB.gameStarted = true;
    DB.moveHistory = [];
    DB.diceHistory = [];
    
    // Reinitialize tokens
    DB.players.forEach((player, index) => {
        DB.tokens[player] = {
            positions: [0, 0, 0, 0],
            home: [true, true, true, true],
            finished: [false, false, false, false],
            color: LUDO.PLAYER_COLORS[index % LUDO.PLAYER_COLORS.length]
        };
    });
    
    renderBoard();
    updatePlayersList();
    updateGameStatus('🔄 New game started! Roll the dice.');
    addHistory('New game started');
    updateTurnIndicator();
    document.getElementById('rollBtn').disabled = false;
}

function closeModal() {
    document.getElementById('gameOverModal').classList.remove('active');
}

// ---------- EVENT LISTENERS ----------
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('game.html')) {
        initGame();
    } else if (window.location.pathname.includes('admin.html')) {
        // Admin page handled by admin.js
    } else {
        initAuth();
    }
});

// ---------- EXPOSE GLOBALLY ----------
window.loginUser = loginUser;
window.signupUser = signupUser;
window.logout = logout;
window.selectMode = selectMode;
window.rollDice = rollDice;
window.restartGame = restartGame;
window.closeModal = closeModal;
window.findOnlineMatch = findOnlineMatch;
window.computerTurn = computerTurn;
window.renderBoard = renderBoard;
