// ============================================
// 🎲 COMPLETE ORIGINAL LUDO GAME
// Full board with proper paths, safe spots, tokens
// ============================================

// ---------- LUDO CONSTANTS ----------
const LUDO = {
    BOARD_SIZE: 15,
    TOTAL_CELLS: 225,
    
    // Player Colors
    COLORS: ['#e74c3c', '#2ecc71', '#3498db', '#f1c40f'],
    COLOR_NAMES: ['Red', 'Green', 'Blue', 'Yellow'],
    
    // Home positions on board
    HOME_BASES: {
        0: { row: 0, col: 0, label: 'R' },    // Red - Top Left
        1: { row: 0, col: 14, label: 'G' },   // Green - Top Right
        2: { row: 14, col: 0, label: 'B' },   // Blue - Bottom Left
        3: { row: 14, col: 14, label: 'Y' }   // Yellow - Bottom Right
    },
    
    // Safe spots (star positions)
    SAFE_SPOTS: [
        0, 7, 14,     // Top row
        105, 119,     // Middle
        210, 217, 224 // Bottom row
    ],
    
    // Player paths (each player has a unique path to home)
    PATHS: {
        0: { start: 1, home: 105, direction: 1 },      // Red
        1: { start: 14, home: 119, direction: -1 },    // Green
        2: { start: 210, home: 105, direction: 1 },    // Blue
        3: { start: 224, home: 119, direction: -1 }    // Yellow
    },
    
    // Home columns (final path to center)
    HOME_COLUMNS: {
        0: [106, 107, 108, 109, 110, 111],  // Red's home column
        1: [112, 113, 114, 115, 116, 117],  // Green's home column
        2: [106, 107, 108, 109, 110, 111],  // Blue's home column
        3: [112, 113, 114, 115, 116, 117]   // Yellow's home column
    }
};

// ---------- GAME STATE ----------
const Game = {
    players: [],
    tokens: {},
    currentTurn: 0,
    diceValue: 0,
    isRolling: false,
    gameOver: false,
    winners: [],
    mode: 2, // 2 or 4 players
    history: [],
    currentUser: null
};

// ---------- AUTHENTICATION ----------
function initAuth() {
    // Login/Signup logic
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        // Simple auth
        if (username && password) {
            Game.currentUser = { username, coins: 100, wins: 0 };
            localStorage.setItem('ludo_user', JSON.stringify(Game.currentUser));
            window.location.href = 'game.html';
        }
    });
}

// ---------- GAME INITIALIZATION ----------
function initGame() {
    const user = JSON.parse(localStorage.getItem('ludo_user'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    Game.currentUser = user;
    document.getElementById('currentUser').textContent = user.username;
    document.getElementById('userCoins').textContent = user.coins;
    document.getElementById('userWins').textContent = user.wins || 0;
    
    createBoard();
    startGame(2);
}

// ---------- CREATE BOARD ----------
function createBoard() {
    const board = document.getElementById('ludoBoard');
    board.innerHTML = '';
    
    for (let i = 0; i < LUDO.TOTAL_CELLS; i++) {
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        cell.dataset.index = i;
        
        const row = Math.floor(i / LUDO.BOARD_SIZE);
        const col = i % LUDO.BOARD_SIZE;
        
        // Center home
        if (row >= 6 && row <= 8 && col >= 6 && col <= 8) {
            cell.classList.add('home-center');
            cell.textContent = '⭐';
        }
        
        // Player home bases
        if (row < 6 && col < 6) {
            cell.style.background = 'rgba(231,76,60,0.15)';
            if (row >= 1 && row <= 4 && col >= 1 && col <= 4) {
                cell.textContent = '🔴';
                cell.classList.add('home-base');
            }
        } else if (row < 6 && col > 8) {
            cell.style.background = 'rgba(46,204,113,0.15)';
            if (row >= 1 && row <= 4 && col >= 10 && col <= 13) {
                cell.textContent = '🟢';
                cell.classList.add('home-base');
            }
        } else if (row > 8 && col < 6) {
            cell.style.background = 'rgba(52,152,219,0.15)';
            if (row >= 10 && row <= 13 && col >= 1 && col <= 4) {
                cell.textContent = '🔵';
                cell.classList.add('home-base');
            }
        } else if (row > 8 && col > 8) {
            cell.style.background = 'rgba(241,196,15,0.15)';
            if (row >= 10 && row <= 13 && col >= 10 && col <= 13) {
                cell.textContent = '🟡';
                cell.classList.add('home-base');
            }
        }
        
        // Safe spots
        if (LUDO.SAFE_SPOTS.includes(i)) {
            cell.classList.add('safe-spot');
            cell.textContent = '✦';
        }
        
        // Home columns (path to center)
        if (row >= 6 && row <= 8 && col === 6) {
            cell.classList.add('home-column', 'red-home');
        }
        if (row >= 6 && row <= 8 && col === 8) {
            cell.classList.add('home-column', 'green-home');
        }
        if (row === 6 && col >= 6 && col <= 8) {
            cell.classList.add('home-column', 'blue-home');
        }
        if (row === 8 && col >= 6 && col <= 8) {
            cell.classList.add('home-column', 'yellow-home');
        }
        
        board.appendChild(cell);
    }
}

// ---------- START GAME ----------
function startGame(mode) {
    Game.mode = mode === 0 ? 'computer' : mode;
    Game.players = [];
    Game.tokens = {};
    Game.winners = [];
    Game.gameOver = false;
    Game.currentTurn = 0;
    Game.history = [];
    
    // Set players
    if (mode === 2) {
        Game.players = [
            { name: Game.currentUser.username, color: LUDO.COLORS[0], isComputer: false },
            { name: 'Player 2', color: LUDO.COLORS[1], isComputer: false }
        ];
    } else if (mode === 4) {
        Game.players = [
            { name: Game.currentUser.username, color: LUDO.COLORS[0], isComputer: false },
            { name: 'Player 2', color: LUDO.COLORS[1], isComputer: false },
            { name: 'Player 3', color: LUDO.COLORS[2], isComputer: false },
            { name: 'Player 4', color: LUDO.COLORS[3], isComputer: false }
        ];
    } else if (mode === 0) {
        Game.players = [
            { name: Game.currentUser.username, color: LUDO.COLORS[0], isComputer: false },
            { name: 'Computer', color: LUDO.COLORS[1], isComputer: true }
        ];
    }
    
    // Initialize tokens for each player
    Game.players.forEach((player, index) => {
        Game.tokens[player.name] = {
            positions: [-1, -1, -1, -1], // -1 = at home, 0+ = on board
            home: [true, true, true, true],
            finished: [false, false, false, false],
            color: player.color,
            startPos: LUDO.PATHS[index]?.start || 0,
            homePath: LUDO.HOME_COLUMNS[index] || []
        };
    });
    
    document.getElementById('gameLog').innerHTML = '';
    addHistory('🎲 Game started!');
    updateUI();
    updateTurnInfo();
    renderBoard();
}

// ---------- ROLL DICE ----------
function rollDice() {
    if (Game.isRolling || Game.gameOver) return;
    
    const currentPlayer = Game.players[Game.currentTurn % Game.players.length];
    
    // Check if computer's turn
    if (currentPlayer.isComputer) {
        computerTurn();
        return;
    }
    
    Game.isRolling = true;
    document.getElementById('rollBtn').disabled = true;
    
    const dice = document.getElementById('dice');
    let count = 0;
    const interval = setInterval(() => {
        const val = Math.floor(Math.random() * 6) + 1;
        dice.textContent = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][val - 1];
        count++;
        if (count > 10) {
            clearInterval(interval);
            const value = Math.floor(Math.random() * 6) + 1;
            dice.textContent = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][value - 1];
            Game.diceValue = value;
            processTurn(currentPlayer, value);
        }
    }, 80);
}

// ---------- PROCESS TURN ----------
function processTurn(player, value) {
    addHistory(`${player.name} rolled ${value}`);
    
    // Check if any token can move
    const movable = getMovableTokens(player.name, value);
    
    if (movable.length === 0) {
        addHistory(`${player.name} cannot move any token`);
        if (value === 6) {
            // Extra turn but can't move
            Game.isRolling = false;
            document.getElementById('rollBtn').disabled = false;
            updateTurnInfo();
            return;
        }
        nextTurn();
        return;
    }
    
    // Auto-move first movable token
    const tokenIndex = movable[0];
    moveToken(player.name, tokenIndex, value);
}

// ---------- GET MOVABLE TOKENS ----------
function getMovableTokens(playerName, value) {
    const tokens = Game.tokens[playerName];
    const movable = [];
    
    for (let i = 0; i < 4; i++) {
        if (tokens.finished[i]) continue;
        
        // Token at home - can only come out on 6
        if (tokens.home[i]) {
            if (value === 6) {
                // Check if start position is occupied by own token
                const startPos = tokens.startPos;
                let occupied = false;
                for (let j = 0; j < 4; j++) {
                    if (i !== j && !tokens.home[j] && tokens.positions[j] === startPos) {
                        occupied = true;
                        break;
                    }
                }
                if (!occupied) movable.push(i);
            }
            continue;
        }
        
        // Token on board - check if can move
        const currentPos = tokens.positions[i];
        const newPos = currentPos + value;
        
        // Check if reached home
        if (newPos >= 56) {
            movable.push(i);
        } else {
            // Check if path is clear
            let blocked = false;
            for (let j = 0; j < 4; j++) {
                if (i !== j && !tokens.home[j] && tokens.positions[j] === newPos) {
                    // If opponent's token, can capture (unless safe spot)
                    const isOpponent = !isOwnToken(playerName, j);
                    if (isOpponent && !LUDO.SAFE_SPOTS.includes(newPos)) {
                        // Can capture
                        break;
                    } else if (isOpponent && LUDO.SAFE_SPOTS.includes(newPos)) {
                        // Safe spot - cannot capture
                        blocked = true;
                        break;
                    }
                }
            }
            if (!blocked) movable.push(i);
        }
    }
    
    // Prioritize tokens closer to home
    movable.sort((a, b) => {
        const posA = tokens.positions[a] || 0;
        const posB = tokens.positions[b] || 0;
        return posB - posA;
    });
    
    return movable;
}

function isOwnToken(playerName, tokenIndex) {
    // Check if token belongs to current player
    const tokens = Game.tokens[playerName];
    return tokens && !tokens.home[tokenIndex];
}

// ---------- MOVE TOKEN ----------
function moveToken(playerName, tokenIndex, value) {
    const tokens = Game.tokens[playerName];
    
    // Token at home - bring out
    if (tokens.home[tokenIndex]) {
        tokens.home[tokenIndex] = false;
        tokens.positions[tokenIndex] = tokens.startPos;
        addHistory(`${playerName} brought token ${tokenIndex + 1} out! 🎯`);
        renderBoard();
        updateUI();
        
        // Check for capture
        checkCapture(playerName, tokenIndex);
        
        // Extra turn
        if (value === 6 && !Game.gameOver) {
            Game.isRolling = false;
            document.getElementById('rollBtn').disabled = false;
            updateTurnInfo();
            addHistory(`${playerName} gets another turn!`);
            return;
        }
        nextTurn();
        return;
    }
    
    // Move on board
    const currentPos = tokens.positions[tokenIndex];
    const newPos = currentPos + value;
    
    // Check if reached home
    if (newPos >= 56) {
        tokens.finished[tokenIndex] = true;
        tokens.home[tokenIndex] = true;
        tokens.positions[tokenIndex] = 56;
        addHistory(`🏆 ${playerName} got token ${tokenIndex + 1} home!`);
        
        // Check if all tokens home
        if (tokens.finished.every(f => f)) {
            Game.winners.push(playerName);
            addHistory(`🏆 ${playerName} wins the game!`);
            if (playerName === Game.currentUser.username) {
                Game.currentUser.coins += 50;
                Game.currentUser.wins = (Game.currentUser.wins || 0) + 1;
                localStorage.setItem('ludo_user', JSON.stringify(Game.currentUser));
                document.getElementById('userCoins').textContent = Game.currentUser.coins;
                document.getElementById('userWins').textContent = Game.currentUser.wins;
            }
            endGame();
            return;
        }
    } else {
        // Move to new position
        tokens.positions[tokenIndex] = newPos;
        addHistory(`${playerName} moved token ${tokenIndex + 1} to position ${newPos}`);
        
        // Check for capture
        checkCapture(playerName, tokenIndex);
    }
    
    renderBoard();
    updateUI();
    
    // Extra turn on 6
    if (value === 6 && !Game.gameOver) {
        Game.isRolling = false;
        document.getElementById('rollBtn').disabled = false;
        updateTurnInfo();
        addHistory(`${playerName} gets another turn!`);
        return;
    }
    
    nextTurn();
}

// ---------- CHECK CAPTURE ----------
function checkCapture(playerName, tokenIndex) {
    const position = Game.tokens[playerName].positions[tokenIndex];
    
    // Can't capture on safe spots
    if (LUDO.SAFE_SPOTS.includes(position)) return;
    
    // Check all other players
    for (const [otherPlayer, tokens] of Object.entries(Game.tokens)) {
        if (otherPlayer === playerName) continue;
        
        for (let i = 0; i < 4; i++) {
            if (tokens.finished[i]) continue;
            if (tokens.home[i]) continue;
            if (tokens.positions[i] === position) {
                // Capture!
                tokens.home[i] = true;
                tokens.positions[i] = -1;
                addHistory(`💥 ${playerName} captured ${otherPlayer}'s token!`);
                renderBoard();
                updateUI();
            }
        }
    }
}

// ---------- NEXT TURN ----------
function nextTurn() {
    if (Game.gameOver) return;
    
    Game.currentTurn++;
    Game.isRolling = false;
    document.getElementById('rollBtn').disabled = false;
    updateTurnInfo();
    updateUI();
    
    const currentPlayer = Game.players[Game.currentTurn % Game.players.length];
    addHistory(`⏳ ${currentPlayer.name}'s turn`);
    
    // Computer turn
    if (currentPlayer.isComputer) {
        setTimeout(() => computerTurn(), 800);
    }
}

// ---------- COMPUTER TURN ----------
function computerTurn() {
    const player = Game.players[Game.currentTurn % Game.players.length];
    if (!player.isComputer || Game.gameOver) return;
    
    const value = Math.floor(Math.random() * 6) + 1;
    document.getElementById('dice').textContent = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][value - 1];
    addHistory(`🤖 Computer rolled ${value}`);
    
    const movable = getMovableTokens(player.name, value);
    
    if (movable.length === 0) {
        addHistory(`🤖 Computer cannot move`);
        if (value === 6) {
            setTimeout(() => computerTurn(), 500);
            return;
        }
        setTimeout(() => nextTurn(), 500);
        return;
    }
    
    // Computer AI: choose best token
    const tokens = Game.tokens[player.name];
    let bestToken = movable[0];
    let bestScore = -1;
    
    movable.forEach(i => {
        let score = 0;
        if (tokens.home[i]) {
            score = 100; // Priority to bring out tokens
        } else {
            score = tokens.positions[i] + value; // Move furthest
            // Bonus for reaching home
            if (tokens.positions[i] + value >= 56) score += 200;
        }
        if (score > bestScore) {
            bestScore = score;
            bestToken = i;
        }
    });
    
    moveToken(player.name, bestToken, value);
}

// ---------- RENDER BOARD ----------
function renderBoard() {
    const cells = document.querySelectorAll('.board-cell');
    cells.forEach(cell => {
        // Clear tokens but keep special markings
        const index = parseInt(cell.dataset.index);
        if (!LUDO.SAFE_SPOTS.includes(index) && 
            !(index >= 90 && index <= 134 && 
              Math.floor(index / 15) >= 6 && Math.floor(index / 15) <= 8)) {
            // Keep only special markings
            if (index >= 0 && index < 225) {
                const row = Math.floor(index / 15);
                const col = index % 15;
                if (row < 6 && col < 6) {
                    if (row >= 1 && row <= 4 && col >= 1 && col <= 4) {
                        // Keep home base
                    } else {
                        // Remove text
                    }
                }
            }
        }
        // Remove tokens
        const tokens = cell.querySelectorAll('.token');
        tokens.forEach(t => t.remove());
    });
    
    // Place tokens on board
    for (const [playerName, tokens] of Object.entries(Game.tokens)) {
        for (let i = 0; i < 4; i++) {
            if (tokens.finished[i]) continue;
            if (tokens.home[i]) continue;
            
            const pos = tokens.positions[i];
            if (pos >= 0 && pos < 225) {
                const cell = document.querySelector(`.board-cell[data-index="${pos}"]`);
                if (cell) {
                    const token = document.createElement('div');
                    token.className = 'token';
                    token.style.background = tokens.color;
                    token.textContent = playerName === Game.currentUser?.username ? '👤' : 
                                       playerName === 'Computer' ? '🤖' : '👥';
                    token.style.color = '#fff';
                    token.style.fontWeight = 'bold';
                    token.style.fontSize = '14px';
                    token.style.display = 'flex';
                    token.style.alignItems = 'center';
                    token.style.justifyContent = 'center';
                    token.style.borderRadius = '50%';
                    token.style.width = '80%';
                    token.style.height = '80%';
                    token.style.border = '2px solid rgba(255,255,255,0.3)';
                    token.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
                    token.style.transition = 'all 0.3s ease';
                    
                    // Add home position markers
                    if (pos >= 106 && pos <= 111) {
                        token.style.borderColor = '#ffd700';
                    }
                    
                    cell.appendChild(token);
                }
            }
        }
    }
}

// ---------- UPDATE UI ----------
function updateUI() {
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = '';
    
    Game.players.forEach((player, index) => {
        const tokens = Game.tokens[player.name];
        const finished = tokens ? tokens.finished.filter(f => f).length : 0;
        const isWinner = Game.winners.includes(player.name);
        const isCurrent = index === Game.currentTurn % Game.players.length;
        
        const div = document.createElement('div');
        div.className = 'player-item';
        div.style.borderLeftColor = player.color;
        div.innerHTML = `
            <span>
                <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${player.color};margin-right:8px;"></span>
                ${player.name} ${player.isComputer ? '🤖' : ''}
                ${isWinner ? '🏆' : ''}
                <span style="font-size:11px;color:rgba(255,255,255,0.5);">(${finished}/4)</span>
            </span>
            <span class="status ${isCurrent ? 'active' : isWinner ? 'winner' : ''}">
                ${isCurrent ? '● Playing' : isWinner ? '🏆 Winner' : '○ Waiting'}
            </span>
        `;
        playersList.appendChild(div);
    });
}

function updateTurnInfo() {
    const current = Game.players[Game.currentTurn % Game.players.length];
    const info = document.getElementById('turnInfo');
    if (Game.gameOver) {
        info.textContent = '🏆 Game Over!';
        return;
    }
    if (current.name === Game.currentUser?.username) {
        info.textContent = '🎯 Your turn!';
        info.style.color = '#2ecc71';
    } else if (current.isComputer) {
        info.textContent = '🤖 Computer is thinking...';
        info.style.color = '#f1c40f';
    } else {
        info.textContent = `⏳ ${current.name}'s turn`;
        info.style.color = 'rgba(255,255,255,0.7)';
    }
}

function addHistory(message) {
    const log = document.getElementById('gameLog');
    const entry = document.createElement('div');
    entry.className = 'history-entry';
    const time = new Date().toLocaleTimeString();
    entry.innerHTML = `<span style="color:#f7971e;">${time}</span> - ${message}`;
    log.prepend(entry);
    while (log.children.length > 50) {
        log.removeChild(log.lastChild);
    }
}

// ---------- END GAME ----------
function endGame() {
    Game.gameOver = true;
    document.getElementById('rollBtn').disabled = true;
    document.getElementById('winnerText').textContent = `🏆 ${Game.winners[0]} wins!`;
    document.getElementById('winnerModal').style.display = 'flex';
    updateUI();
    addHistory(`🏆 Game Over! ${Game.winners[0]} wins!`);
}

function restartGame() {
    document.getElementById('winnerModal').style.display = 'none';
    startGame(Game.mode === 'computer' ? 0 : Game.mode);
}

// ---------- LOGOUT ----------
function logout() {
    localStorage.removeItem('ludo_user');
    window.location.href = 'index.html';
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('game.html')) {
        initGame();
    } else {
        initAuth();
    }
});

// Make functions globally accessible
window.rollDice = rollDice;
window.startGame = startGame;
window.restartGame = restartGame;
window.logout = logout;
