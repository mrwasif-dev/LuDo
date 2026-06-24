// ============================================
// 📞 COMPLETE CALL & MESSAGING APP
// Frontend Logic
// ============================================

// ---------- GLOBALS ----------
let socket = null;
let currentUser = null;
let currentChat = null;
let isCalling = false;
let isMuted = false;
let isVideoOn = true;
let isSpeakerOn = false;
let peerConnection = null;
let localStream = null;
let remoteStream = null;
let pendingCall = null;

// ---------- DOM REFS ----------
const $ = (id) => document.getElementById(id);

// ---------- LOGIN ----------
function login(event) {
    event.preventDefault();
    const username = $('username').value.trim();
    const password = $('password').value.trim();
    
    if (!username || !password) {
        showError('Please enter username and password');
        return;
    }
    
    // Store user data
    currentUser = {
        username: username,
        avatar: `https://ui-avatars.com/api/?name=${username}&background=f7971e&color=fff`
    };
    
    localStorage.setItem('call_user', JSON.stringify(currentUser));
    
    // Connect to socket
    connectSocket();
}

function showSignup() {
    $('signupModal').style.display = 'flex';
}

function closeSignup() {
    $('signupModal').style.display = 'none';
}

function signup(event) {
    event.preventDefault();
    const username = $('signupUsername').value.trim();
    const password = $('signupPassword').value.trim();
    const displayName = $('signupDisplayName').value.trim() || username;
    
    if (!username || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    // Save user
    const users = JSON.parse(localStorage.getItem('call_users') || '[]');
    if (users.find(u => u.username === username)) {
        alert('Username already exists!');
        return;
    }
    
    users.push({ username, password, displayName });
    localStorage.setItem('call_users', JSON.stringify(users));
    
    alert('Account created! Please login.');
    closeSignup();
    $('username').value = username;
}

function showError(message) {
    $('errorMessage').textContent = message;
    $('errorMessage').style.display = 'block';
    setTimeout(() => {
        $('errorMessage').style.display = 'none';
    }, 3000);
}

// ---------- SOCKET CONNECTION ----------
function connectSocket() {
    // Connect to server
    socket = io();
    
    socket.on('connect', () => {
        console.log('🔗 Connected to server');
        
        // Login user
        socket.emit('user_login', {
            username: currentUser.username,
            avatar: currentUser.avatar
        });
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    });
    
    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        showError('Failed to connect to server');
    });
}

// ---------- DASHBOARD ----------
function initDashboard() {
    // Get user from storage
    const userData = localStorage.getItem('call_user');
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = JSON.parse(userData);
    
    // Update profile
    $('profileName').textContent = currentUser.username;
    $('profileAvatar').src = currentUser.avatar;
    $('profileStatus').textContent = 'Online';
    $('profileStatus').style.color = '#2ecc71';
    
    // Connect socket if not connected
    if (!socket) {
        connectSocket();
        return;
    }
    
    // Setup socket events
    setupSocketEvents();
    
    // Setup navigation
    setupNavigation();
    
    // Load data
    loadChats();
    loadCalls();
    loadContacts();
}

function setupSocketEvents() {
    // User online
    socket.on('user_online', (data) => {
        console.log('User online:', data);
        updateUserStatus(data.username, true);
        if (data.users) {
            updateOnlineUsers(data.users);
        }
    });
    
    socket.on('user_offline', (data) => {
        console.log('User offline:', data);
        updateUserStatus(data.username, false);
        if (data.users) {
            updateOnlineUsers(data.users);
        }
    });
    
    // Current users
    socket.on('current_users', (users) => {
        console.log('Current users:', users);
        updateOnlineUsers(users);
    });
    
    // New message
    socket.on('new_message', (data) => {
        console.log('New message:', data);
        addMessageToChat(data);
        updateChatList(data);
        
        // Show notification if not in chat
        if (!currentChat || currentChat !== data.from) {
            showNotification(`📩 ${data.from}: ${data.message}`);
        }
    });
    
    // Message sent confirmation
    socket.on('message_sent', (data) => {
        console.log('Message sent:', data);
        addMessageToChat(data);
    });
    
    // Message history
    socket.on('message_history', (history) => {
        console.log('Message history:', history);
        // Store history
        if (history) {
            // Handle history
        }
    });
    
    // Incoming call
    socket.on('incoming_call', (data) => {
        console.log('Incoming call:', data);
        showIncomingCall(data);
    });
    
    // Call accepted
    socket.on('call_accepted', (data) => {
        console.log('Call accepted:', data);
        startCallSession(data);
    });
    
    // Call rejected
    socket.on('call_rejected', (data) => {
        console.log('Call rejected:', data);
        hideCallInterface();
        showNotification('Call rejected');
    });
    
    // Call ended
    socket.on('call_ended', (data) => {
        console.log('Call ended:', data);
        endCallSession();
    });
    
    // Call waiting
    socket.on('call_waiting', (data) => {
        console.log('Call waiting:', data);
        $('callStatus').textContent = 'Ringing...';
        $('callStatus').style.color = '#f1c40f';
    });
    
    // WebRTC signals
    socket.on('webrtc_offer', (data) => {
        handleOffer(data);
    });
    
    socket.on('webrtc_answer', (data) => {
        handleAnswer(data);
    });
    
    socket.on('webrtc_ice', (data) => {
        handleIceCandidate(data);
    });
    
    // Typing
    socket.on('user_typing', (data) => {
        if (currentChat === data.from) {
            $('chatUserStatus').textContent = data.isTyping ? 'Typing...' : 'Online';
            $('chatUserStatus').style.color = data.isTyping ? '#f1c40f' : '#2ecc71';
        }
    });
}

// ---------- NAVIGATION ----------
function setupNavigation() {
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            const tab = this.dataset.tab;
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            $(tab + 'Section').classList.add('active');
            
            // Hide chat window
            if (tab !== 'chats') {
                $('chatWindow').style.display = 'none';
            }
        });
    });
}

// ---------- CHATS ----------
function loadChats() {
    // Load chat list from localStorage or server
    const chats = JSON.parse(localStorage.getItem('call_chats') || '[]');
    renderChats(chats);
}

function renderChats(chats) {
    const container = $('chatList');
    container.innerHTML = '';
    
    if (chats.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comment-dots"></i>
                <h3>No chats yet</h3>
                <p>Start a conversation with someone</p>
            </div>
        `;
        return;
    }
    
    chats.forEach(chat => {
        const div = document.createElement('div');
        div.className = 'chat-item';
        div.onclick = () => openChat(chat.username);
        div.innerHTML = `
            <img src="${chat.avatar || `https://ui-avatars.com/api/?name=${chat.username}&background=3498db&color=fff`}" alt="">
            <div class="chat-info">
                <h4>${chat.username}</h4>
                <span>${chat.lastMessage || 'No messages'}</span>
            </div>
            <span class="chat-time">${chat.time || ''}</span>
            ${chat.unread ? `<span class="unread-badge">${chat.unread}</span>` : ''}
        `;
        container.appendChild(div);
    });
}

function openChat(username) {
    currentChat = username;
    $('chatWindow').style.display = 'flex';
    $('chatUserName').textContent = username;
    $('chatUserAvatar').src = `https://ui-avatars.com/api/?name=${username}&background=3498db&color=fff`;
    
    // Load messages
    loadMessages(username);
    
    // Mark as read
    socket.emit('mark_read', { from: username });
}

function loadMessages(username) {
    const container = $('chatMessages');
    container.innerHTML = '';
    
    // Get messages from localStorage or server
    const messages = JSON.parse(localStorage.getItem(`call_messages_${username}`) || '[]');
    
    messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = `message ${msg.from === currentUser.username ? 'sent' : 'received'}`;
        div.innerHTML = `
            <span>${msg.message}</span>
            <small>${formatTime(msg.timestamp)}</small>
        `;
        container.appendChild(div);
    });
    
    container.scrollTop = container.scrollHeight;
}

function sendMessage() {
    const input = $('messageInput');
    const message = input.value.trim();
    
    if (!message || !currentChat) return;
    
    const msgData = {
        to: currentChat,
        message: message,
        type: 'text'
    };
    
    socket.emit('send_message', msgData);
    input.value = '';
}

function addMessageToChat(data) {
    if (currentChat !== data.from && currentChat !== data.to) return;
    
    const container = $('chatMessages');
    const isSent = data.from === currentUser.username;
    
    const div = document.createElement('div');
    div.className = `message ${isSent ? 'sent' : 'received'}`;
    div.innerHTML = `
        <span>${data.message}</span>
        <small>${formatTime(data.timestamp)}</small>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    
    // Save to localStorage
    saveMessage(data);
}

function saveMessage(data) {
    const key = `call_messages_${data.from}`;
    const messages = JSON.parse(localStorage.getItem(key) || '[]');
    messages.push(data);
    localStorage.setItem(key, JSON.stringify(messages));
}

function updateChatList(data) {
    // Update chat list
    const chats = JSON.parse(localStorage.getItem('call_chats') || '[]');
    const existing = chats.find(c => c.username === data.from);
    
    if (existing) {
        existing.lastMessage = data.message;
        existing.time = formatTime(data.timestamp);
        existing.unread = (existing.unread || 0) + 1;
    } else {
        chats.push({
            username: data.from,
            avatar: `https://ui-avatars.com/api/?name=${data.from}&background=3498db&color=fff`,
            lastMessage: data.message,
            time: formatTime(data.timestamp),
            unread: 1
        });
    }
    
    localStorage.setItem('call_chats', JSON.stringify(chats));
    renderChats(chats);
}

function startNewChat() {
    const username = prompt('Enter username to chat with:');
    if (username && username !== currentUser.username) {
        openChat(username);
    }
}

function closeChat() {
    $('chatWindow').style.display = 'none';
    currentChat = null;
}

// ---------- CALLS ----------
function loadCalls() {
    const calls = JSON.parse(localStorage.getItem('call_history') || '[]');
    renderCalls(calls);
}

function renderCalls(calls) {
    const container = $('callList');
    container.innerHTML = '';
    
    if (calls.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-phone"></i>
                <h3>No calls yet</h3>
                <p>Your call history will appear here</p>
            </div>
        `;
        return;
    }
    
    calls.forEach(call => {
        const div = document.createElement('div');
        div.className = 'call-item';
        div.innerHTML = `
            <div class="call-info">
                <img src="${call.avatar || `https://ui-avatars.com/api/?name=${call.username}&background=f7971e&color=fff`}" alt="">
                <div>
                    <h4>${call.username}</h4>
                    <span>
                        ${call.type === 'video' ? '📹' : '📞'} 
                        ${call.status === 'connected' ? '✅' : call.status === 'missed' ? '❌' : ''}
                        ${call.time}
                    </span>
                </div>
            </div>
            <div class="call-actions">
                <button class="call-btn-action" onclick="makeCall('${call.username}', 'voice')">
                    <i class="fas fa-phone"></i>
                </button>
                <button class="video-btn" onclick="makeCall('${call.username}', 'video')">
                    <i class="fas fa-video"></i>
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

// ---------- CONTACTS ----------
function loadContacts() {
    const contacts = JSON.parse(localStorage.getItem('call_contacts') || '[]');
    renderContacts(contacts);
}

function renderContacts(contacts) {
    const container = $('contactList');
    container.innerHTML = '';
    
    if (contacts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-address-book"></i>
                <h3>No contacts</h3>
                <p>Add contacts to get started</p>
            </div>
        `;
        return;
    }
    
    contacts.forEach(contact => {
        const div = document.createElement('div');
        div.className = 'contact-item';
        div.innerHTML = `
            <div class="contact-info">
                <img src="${contact.avatar || `https://ui-avatars.com/api/?name=${contact.username}&background=2ecc71&color=fff`}" alt="">
                <div>
                    <h4>${contact.username}</h4>
                    <span>${contact.status || 'Online'}</span>
                </div>
            </div>
            <div class="call-actions">
                <button class="call-btn-action" onclick="makeCall('${contact.username}', 'voice')">
                    <i class="fas fa-phone"></i>
                </button>
                <button class="video-btn" onclick="makeCall('${contact.username}', 'video')">
                    <i class="fas fa-video"></i>
                </button>
                <button class="delete-btn" onclick="removeContact('${contact.username}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

function addContact() {
    const username = prompt('Enter username to add:');
    if (username && username !== currentUser.username) {
        const contacts = JSON.parse(localStorage.getItem('call_contacts') || '[]');
        if (!contacts.find(c => c.username === username)) {
            contacts.push({
                username: username,
                avatar: `https://ui-avatars.com/api/?name=${username}&background=2ecc71&color=fff`
            });
            localStorage.setItem('call_contacts', JSON.stringify(contacts));
            renderContacts(contacts);
            showNotification(`✅ ${username} added to contacts`);
        } else {
            alert('Contact already exists!');
        }
    }
}

function removeContact(username) {
    if (confirm(`Remove ${username} from contacts?`)) {
        let contacts = JSON.parse(localStorage.getItem('call_contacts') || '[]');
        contacts = contacts.filter(c => c.username !== username);
        localStorage.setItem('call_contacts', JSON.stringify(contacts));
        renderContacts(contacts);
        showNotification(`❌ ${username} removed`);
    }
}

// ---------- CALL FUNCTIONS ----------
function makeCall(username, type) {
    if (username === currentUser.username) {
        alert('You cannot call yourself!');
        return;
    }
    
    // Show call interface
    showCallInterface(username, type);
    
    // Send call request
    socket.emit('call_request', {
        to: username,
        type: type
    });
    
    // Start WebRTC
    startWebRTC(username, type);
}

function startCall(type) {
    if (!currentChat) {
        alert('Open a chat first!');
        return;
    }
    makeCall(currentChat, type);
}

function showCallInterface(username, type) {
    $('callInterface').style.display = 'flex';
    $('callerName').textContent = username;
    $('callerAvatar').src = `https://ui-avatars.com/api/?name=${username}&background=f7971e&color=fff`;
    $('callStatus').textContent = 'Calling...';
    $('callStatus').style.color = '#f1c40f';
    $('callPlaceholder').style.display = 'flex';
    $('remoteVideo').style.display = 'none';
    isCalling = true;
}

function hideCallInterface() {
    $('callInterface').style.display = 'none';
    isCalling = false;
    endWebRTC();
}

function showIncomingCall(data) {
    $('incomingCall').style.display = 'flex';
    $('incomingCallerName').textContent = data.from;
    $('incomingCallerAvatar').src = data.fromAvatar;
    pendingCall = data;
}

function acceptCall() {
    $('incomingCall').style.display = 'none';
    showCallInterface(pendingCall.from, pendingCall.type);
    socket.emit('accept_call', { from: pendingCall.from });
    startWebRTC(pendingCall.from, pendingCall.type);
}

function rejectCall() {
    $('incomingCall').style.display = 'none';
    if (pendingCall) {
        socket.emit('reject_call', { from: pendingCall.from });
        pendingCall = null;
    }
}

function endCall() {
    if (isCalling) {
        socket.emit('end_call', { to: currentChat || pendingCall?.from });
        hideCallInterface();
        showNotification('Call ended');
    }
}

function toggleMute() {
    isMuted = !isMuted;
    const btn = document.querySelector('.call-btn:first-child');
    if (localStream) {
        localStream.getAudioTracks().forEach(track => {
            track.enabled = !isMuted;
        });
    }
    if (isMuted) {
        btn.innerHTML = '<i class="fas fa-microphone-slash"></i><span>Muted</span>';
        btn.style.color = '#e74c3c';
    } else {
        btn.innerHTML = '<i class="fas fa-microphone"></i><span>Mute</span>';
        btn.style.color = '';
    }
}

function toggleVideo() {
    isVideoOn = !isVideoOn;
    const btn = document.querySelector('.call-btn:nth-child(2)');
    if (localStream) {
        localStream.getVideoTracks().forEach(track => {
            track.enabled = isVideoOn;
        });
    }
    if (isVideoOn) {
        btn.innerHTML = '<i class="fas fa-video"></i><span>Video</span>';
        $('localVideo').style.display = 'block';
        btn.style.color = '';
    } else {
        btn.innerHTML = '<i class="fas fa-video-slash"></i><span>Video</span>';
        $('localVideo').style.display = 'none';
        btn.style.color = '#e74c3c';
    }
}

function toggleSpeaker() {
    isSpeakerOn = !isSpeakerOn;
    const btn = document.querySelector('.call-btn:nth-child(3)');
    if (isSpeakerOn) {
        btn.innerHTML = '<i class="fas fa-volume-up"></i><span>Speaker</span>';
        btn.style.color = '#2ecc71';
    } else {
        btn.innerHTML = '<i class="fas fa-volume-off"></i><span>Speaker</span>';
        btn.style.color = '';
    }
}

// ---------- WEBRTC ----------
async function startWebRTC(username, type) {
    try {
        // Get local stream
        const constraints = {
            audio: true,
            video: type === 'video'
        };
        
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        $('localVideo').srcObject = localStream;
        
        // Create peer connection
        const configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        };
        
        peerConnection = new RTCPeerConnection(configuration);
        
        // Add local stream
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
        
        // Handle remote stream
        peerConnection.ontrack = (event) => {
            remoteStream = event.streams[0];
            $('remoteVideo').srcObject = remoteStream;
            $('remoteVideo').style.display = 'block';
            $('callPlaceholder').style.display = 'none';
            $('callStatus').textContent = 'Connected';
            $('callStatus').style.color = '#2ecc71';
        };
        
        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('webrtc_ice', {
                    to: username,
                    candidate: event.candidate
                });
            }
        };
        
        // Create offer if caller
        if (isCalling) {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socket.emit('webrtc_offer', {
                to: username,
                offer: offer
            });
        }
        
    } catch (error) {
        console.error('WebRTC error:', error);
        showNotification('Failed to start call');
        hideCallInterface();
    }
}

function handleOffer(data) {
    if (!peerConnection) return;
    
    peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    peerConnection.createAnswer()
        .then(answer => {
            peerConnection.setLocalDescription(answer);
            socket.emit('webrtc_answer', {
                to: data.from,
                answer: answer
            });
        });
}

function handleAnswer(data) {
    if (!peerConnection) return;
    peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
}

function handleIceCandidate(data) {
    if (!peerConnection) return;
    peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
}

function endWebRTC() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    if (remoteStream) {
        remoteStream = null;
    }
}

function startCallSession(data) {
    // Call connected
    $('callStatus').textContent = 'Connected';
    $('callStatus').style.color = '#2ecc71';
}

function endCallSession() {
    hideCallInterface();
    showNotification('Call ended');
}

// ---------- UTILITY ----------
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function showNotification(message) {
    // Simple notification
    const div = document.createElement('div');
    div.className = 'toast-notification';
    div.textContent = message;
    div.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #1a1a2e;
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.1);
        z-index: 9999;
        animation: slideUp 0.5s ease;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    `;
    document.body.appendChild(div);
    
    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transition = 'opacity 0.5s';
        setTimeout(() => div.remove(), 500);
    }, 3000);
}

function updateUserStatus(username, online) {
    // Update UI for user status
    if (currentChat === username) {
        $('chatUserStatus').textContent = online ? 'Online' : 'Offline';
        $('chatUserStatus').style.color = online ? '#2ecc71' : '#e74c3c';
    }
}

function updateOnlineUsers(users) {
    // Update contact list status
    const contacts = JSON.parse(localStorage.getItem('call_contacts') || '[]');
    contacts.forEach(contact => {
        const user = users.find(u => u.username === contact.username);
        if (user) {
            contact.status = user.online ? 'Online' : 'Offline';
        }
    });
    localStorage.setItem('call_contacts', JSON.stringify(contacts));
    renderContacts(contacts);
}

function logout() {
    if (socket) {
        socket.disconnect();
    }
    localStorage.removeItem('call_user');
    window.location.href = 'index.html';
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('dashboard.html')) {
        initDashboard();
    }
});

// Make functions globally accessible
window.login = login;
window.signup = signup;
window.logout = logout;
window.showSignup = showSignup;
window.closeSignup = closeSignup;
window.startNewChat = startNewChat;
window.sendMessage = sendMessage;
window.openChat = openChat;
window.closeChat = closeChat;
window.makeCall = makeCall;
window.startCall = startCall;
window.endCall = endCall;
window.acceptCall = acceptCall;
window.rejectCall = rejectCall;
window.toggleMute = toggleMute;
window.toggleVideo = toggleVideo;
window.toggleSpeaker = toggleSpeaker;
window.addContact = addContact;
window.removeContact = removeContact;
window.toggleEmoji = () => {};
