const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, '/')));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'game.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// API Routes
app.get('/api/users', (req, res) => {
    const users = JSON.parse(localStorage.getItem('ludo_users')) || [];
    res.json(users);
});

app.get('/api/stats', (req, res) => {
    const users = JSON.parse(localStorage.getItem('ludo_users')) || [];
    const games = JSON.parse(localStorage.getItem('ludo_games')) || [];
    res.json({
        totalUsers: users.length,
        totalCoins: users.reduce((sum, u) => sum + (u.coins || 0), 0),
        totalGames: games.length
    });
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Ludo Kingdom is running!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🎲 Ludo Kingdom server running on port ${PORT}`);
    console.log(`📍 Visit: http://localhost:${PORT}`);
    console.log(`🔐 Admin Panel: http://localhost:${PORT}/admin`);
});
