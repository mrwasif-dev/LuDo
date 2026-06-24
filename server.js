const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(express.static(path.join(__dirname, '/')));
app.use(express.json());

// ---------- DATA STORE ----------
const users = {};
const messages = {};
const callHistory = {};

// ---------- SOCKET.IO ----------
io.on('connection', (socket) => {
    console.log('🔗 New user connected:', socket.id);

    // User login
    socket.on('user_login', (data) => {
        const { username, avatar } = data;
        
        users[username] = {
            id: socket.id,
            username: username,
            avatar: avatar || `https://ui-avatars.com/api/?name=${username}&background=f7971e&color=fff`,
            online: true,
            lastSeen: new Date().toISOString()
        };
        
        socket.username = username;
        
        io.emit('user_online', {
            username: username,
            users: Object.values(users)
        });
        
        socket.emit('current_users', Object.values(users));
        socket.emit('message_history', messages);
        
        console.log(`✅ ${username} logged in`);
    });

    // Send message
    socket.on('send_message', (data) => {
        const { to, message, type } = data;
        const from = socket.username;
        
        const msgData = {
            id: Date.now().toString(),
            from: from,
            to: to,
            message: message,
            type: type || 'text',
            timestamp: new Date().toISOString(),
            read: false
        };
        
        if (!messages[from]) messages[from] = [];
        if (!messages[to]) messages[to] = [];
        messages[from].push(msgData);
        messages[to].push(msgData);
        
        if (users[to] && users[to].online) {
            io.to(users[to].id).emit('new_message', msgData);
        }
        
        socket.emit('message_sent', msgData);
    });

    // Call request
    socket.on('call_request', (data) => {
        const { to, type } = data;
        const from = socket.username;
        
        if (users[to] && users[to].online) {
            io.to(users[to].id).emit('incoming_call', {
                from: from,
                fromAvatar: users[from].avatar,
                type: type,
                timestamp: new Date().toISOString()
            });
            
            socket.emit('call_waiting', {
                to: to,
                status: 'waiting'
            });
        } else {
            socket.emit('call_error', {
                message: 'User is offline',
                to: to
            });
        }
    });

    // Accept call
    socket.on('accept_call', (data) => {
        const { from } = data;
        const to = socket.username;
        
        if (users[from] && users[from].online) {
            io.to(users[from].id).emit('call_accepted', {
                from: to,
                to: from,
                status: 'connected'
            });
            
            socket.emit('call_connected', {
                from: from,
                to: to,
                status: 'connected'
            });
        }
    });

    // Reject call
    socket.on('reject_call', (data) => {
        const { from } = data;
        if (users[from] && users[from].online) {
            io.to(users[from].id).emit('call_rejected', {
                from: socket.username,
                to: from,
                status: 'rejected'
            });
        }
    });

    // End call
    socket.on('end_call', (data) => {
        const { to } = data;
        const from = socket.username;
        
        if (users[to] && users[to].online) {
            io.to(users[to].id).emit('call_ended', {
                from: from,
                to: to,
                status: 'ended'
            });
        }
    });

    // WebRTC signaling
    socket.on('webrtc_offer', (data) => {
        const { to, offer } = data;
        if (users[to] && users[to].online) {
            io.to(users[to].id).emit('webrtc_offer', {
                from: socket.username,
                offer: offer
            });
        }
    });

    socket.on('webrtc_answer', (data) => {
        const { to, answer } = data;
        if (users[to] && users[to].online) {
            io.to(users[to].id).emit('webrtc_answer', {
                from: socket.username,
                answer: answer
            });
        }
    });

    socket.on('webrtc_ice', (data) => {
        const { to, candidate } = data;
        if (users[to] && users[to].online) {
            io.to(users[to].id).emit('webrtc_ice', {
                from: socket.username,
                candidate: candidate
            });
        }
    });

    // Typing indicator
    socket.on('typing', (data) => {
        const { to, isTyping } = data;
        if (users[to] && users[to].online) {
            io.to(users[to].id).emit('user_typing', {
                from: socket.username,
                isTyping: isTyping
            });
        }
    });

    // Disconnect
    socket.on('disconnect', () => {
        const username = socket.username;
        if (username && users[username]) {
            users[username].online = false;
            users[username].lastSeen = new Date().toISOString();
            
            io.emit('user_offline', {
                username: username,
                users: Object.values(users)
            });
            
            console.log(`🔴 ${username} disconnected`);
        }
    });
});

// ---------- ROUTES ----------
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'App is running!' });
});

// ---------- START SERVER ----------
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
});
