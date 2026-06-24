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

// Health check for Heroku
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Ludo Kingdom is running!' });
});

// API Routes (for future expansion)
app.get('/api/users', (req, res) => {
    // This would connect to a database in production
    res.json({ message: 'API endpoint ready' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🎲 Ludo Kingdom server running on port ${PORT}`);
    console.log(`📍 Visit: http://localhost:${PORT}`);
});
