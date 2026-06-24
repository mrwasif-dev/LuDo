const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
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
        
        // Store user
        users[username] = {
            id: socket.id,
            username: username,
            avatar: avatar || `https://ui-avatars.com/api/?name=${username}&background=f7971e&color=fff`,
            online: true,
            lastSeen: new Date().toISOString()
        };
        
        socket.username = username;
        
        // Broadcast online status
        io.emit('user_online', {
            username: username,
            users: Object.values(users)
        });
        
        // Send current users to new user
        socket.emit('current_users', Object.values(users));
        
        // Send message history
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
        
        // Store message
        if (!messages[from]) messages[from] = [];
        if (!messages[to]) messages[to] = [];
        messages[from].push(msgData);
        messages[to].push(msgData);
        
        // Send to recipient if online
        if (users[to] && users[to].online) {
            io.to(users[to].id).emit('new_message', msgData);
        }
        
        // Send back to sender
        socket.emit('message_sent', msgData);
    });

    // Call request
    socket.on('call_request', (data) => {
        const { to, type } = data;
        const from = socket.username;
        
        if (users[to] && users[to].online) {
            // Send call request to recipient
            io.to(users[to].id).emit('incoming_call', {
                from: from,
                fromAvatar: users[from].avatar,
                type: type,
                timestamp: new Date().toISOString()
            });
            
            // Send waiting status to caller
            socket.emit('call_waiting', {
                to: to,
                status: 'waiting'
            });
            
            // Store call history
            if (!callHistory[from]) callHistory[from] = [];
            if (!callHistory[to]) callHistory[to] = [];
            
            const callData = {
                id: Date.now().toString(),
                from: from,
                to: to,
                type: type,
                status: 'ringing',
                timestamp: new Date().toISOString()
            };
            
            callHistory[from].push(callData);
            callHistory[to].push(callData);
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
            
            // Update call history
            updateCallStatus(from, to, 'connected');
        }
    });

    // Reject call
    socket.on('reject_call', (data) => {
        const { from } = data;
        const to = socket.username;
        
        if (users[from] && users[from].online) {
            io.to(users[from].id).emit('call_rejected', {
                from: to,
                to: from,
                status: 'rejected'
            });
            
            updateCallStatus(from, to, 'rejected');
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
        
        updateCallStatus(from, to, 'ended');
    });

    // WebRTC signaling
    socket.on('webrtc_offer', (data) => {
        const { to, offer } = data;
        const from = socket.username;
        
        if (users[to] && users[to].online) {
            io.to(users[to].id).emit('webrtc_offer', {
                from: from,
                offer: offer
            });
        }
    });

    socket.on('webrtc_answer', (data) => {
        const { to, answer } = data;
        const from = socket.username;
        
        if (users[to] && users[to].online) {
            io.to(users[to].id).emit('webrtc_answer', {
                from: from,
                answer: answer
            });
        }
    });

    socket.on('webrtc_ice', (data) => {
        const { to, candidate } = data;
        const from = socket.username;
        
        if (users[to] && users[to].online) {
            io.to(users[to].id).emit('webrtc_ice', {
                from: from,
                candidate: candidate
            });
        }
    });

    // Typing indicator
    socket.on('typing', (data) => {
        const { to, isTyping } = data;
        const from = socket.username;
        
        if (users[to] && users[to].online) {
            io.to(users[to].id).emit('user_typing', {
                from: from,
                isTyping: isTyping
            });
        }
    });

    // Mark messages as read
    socket.on('mark_read', (data) => {
        const { from } = data;
        const to = socket.username;
        
        if (messages[from]) {
            messages[from].forEach(msg => {
                if (msg.to === to && !msg.read) {
                    msg.read = true;
                }
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

// ---------- HELPER FUNCTIONS ----------
function updateCallStatus(from, to, status) {
    if (callHistory[from]) {
        const lastCall = callHistory[from][callHistory[from].length - 1];
        if (lastCall && lastCall.to === to) {
            lastCall.status = status;
        }
    }
    if (callHistory[to]) {
        const lastCall = callHistory[to][callHistory[to].length - 1];
        if (lastCall && lastCall.from === from) {
            lastCall.status = status;
        }
    }
}

// ---------- ROUTES ----------
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/api/users', (req, res) => {
    res.json(Object.values(users));
});

app.get('/api/messages/:user', (req, res) => {
    const { user } = req.params;
    res.json(messages[user] || []);
});

// ---------- START SERVER ----------
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`📞 Call & Messaging App Ready!`);
});
