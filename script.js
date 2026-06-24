// ============================================
// 📞 PRO CALL - Complete Calling Application
// ============================================

// ---------- DATA ----------
const App = {
    user: {
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=f7971e&color=fff&size=100'
    },
    contacts: [
        { id: 1, name: 'Sarah Johnson', phone: '+1 234 567 890', avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=3498db&color=fff', favorite: true, status: 'online' },
        { id: 2, name: 'Michael Chen', phone: '+1 234 567 891', avatar: 'https://ui-avatars.com/api/?name=Michael+Chen&background=2ecc71&color=fff', favorite: false, status: 'offline' },
        { id: 3, name: 'Emma Wilson', phone: '+1 234 567 892', avatar: 'https://ui-avatars.com/api/?name=Emma+Wilson&background=e74c3c&color=fff', favorite: true, status: 'online' },
        { id: 4, name: 'David Brown', phone: '+1 234 567 893', avatar: 'https://ui-avatars.com/api/?name=David+Brown&background=9b59b6&color=fff', favorite: false, status: 'away' },
        { id: 5, name: 'Lisa Anderson', phone: '+1 234 567 894', avatar: 'https://ui-avatars.com/api/?name=Lisa+Anderson&background=f1c40f&color=000', favorite: true, status: 'online' }
    ],
    calls: [
        { id: 1, name: 'Sarah Johnson', time: '10:30 AM', type: 'video', missed: false, duration: '5:23' },
        { id: 2, name: 'Michael Chen', time: 'Yesterday', type: 'voice', missed: true, duration: '-' },
        { id: 3, name: 'Emma Wilson', time: 'Yesterday', type: 'video', missed: false, duration: '12:45' },
        { id: 4, name: 'David Brown', time: '2 days ago', type: 'voice', missed: false, duration: '3:12' },
        { id: 5, name: 'Lisa Anderson', time: '3 days ago', type: 'video', missed: false, duration: '8:30' }
    ],
    isCalling: false,
    isMuted: false,
    isVideoOn: true,
    isSpeakerOn: false,
    currentCall: null,
    darkMode: false
};

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', function() {
    renderCalls();
    renderContacts();
    renderFavorites();
    setupNavigation();
    setupSearch();
});

// ---------- NAVIGATION ----------
function setupNavigation() {
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active state
            document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding section
            const tab = this.dataset.tab;
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            document.getElementById(tab + 'Section').classList.add('active');
        });
    });
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        filterContacts(query);
        filterCalls(query);
    });
}

// ---------- RENDER CALLS ----------
function renderCalls() {
    const container = document.getElementById('callList');
    container.innerHTML = '';
    
    App.calls.forEach(call => {
        const div = document.createElement('div');
        div.className = 'call-item';
        div.innerHTML = `
            <div class="call-info">
                <img src="${getAvatar(call.name)}" alt="${call.name}">
                <div class="call-details">
                    <h4>${call.name}</h4>
                    <span>
                        ${call.missed ? '<i class="fas fa-phone-slash" style="color:#e74c3c;"></i>' : '<i class="fas fa-phone" style="color:#2ecc71;"></i>'}
                        ${call.type === 'video' ? '📹' : '📞'} ${call.time}
                        ${call.duration !== '-' ? `• ${call.duration}` : ''}
                    </span>
                </div>
            </div>
            <div class="call-actions">
                <button class="call-btn-action" onclick="startCall('${call.name}', 'voice')">
                    <i class="fas fa-phone"></i>
                </button>
                <button class="video-btn" onclick="startCall('${call.name}', 'video')">
                    <i class="fas fa-video"></i>
                </button>
                <button class="delete-btn" onclick="deleteCall(${call.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

// ---------- RENDER CONTACTS ----------
function renderContacts() {
    const container = document.getElementById('contactList');
    container.innerHTML = '';
    
    App.contacts.forEach(contact => {
        const div = document.createElement('div');
        div.className = 'contact-item';
        div.innerHTML = `
            <div class="contact-info">
                <img src="${contact.avatar}" alt="${contact.name}">
                <div class="contact-details">
                    <h4>${contact.name}</h4>
                    <span>${contact.phone} • ${contact.status}</span>
                </div>
            </div>
            <div class="call-actions">
                <button class="call-btn-action" onclick="startCall('${contact.name}', 'voice')">
                    <i class="fas fa-phone"></i>
                </button>
                <button class="video-btn" onclick="startCall('${contact.name}', 'video')">
                    <i class="fas fa-video"></i>
                </button>
                <button class="${contact.favorite ? 'favorite-btn' : 'favorite-btn'}" onclick="toggleFavorite(${contact.id})">
                    <i class="${contact.favorite ? 'fas' : 'far'} fa-star" style="${contact.favorite ? 'color:#f1c40f;' : ''}"></i>
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

// ---------- RENDER FAVORITES ----------
function renderFavorites() {
    const container = document.getElementById('favoriteList');
    container.innerHTML = '';
    
    const favorites = App.contacts.filter(c => c.favorite);
    
    if (favorites.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px;color:var(--text-secondary);">
                <i class="fas fa-star" style="font-size:48px;margin-bottom:15px;display:block;"></i>
                <h3>No favorites yet</h3>
                <p>Add contacts to favorites for quick access</p>
            </div>
        `;
        return;
    }
    
    favorites.forEach(contact => {
        const div = document.createElement('div');
        div.className = 'contact-item';
        div.innerHTML = `
            <div class="contact-info">
                <img src="${contact.avatar}" alt="${contact.name}">
                <div class="contact-details">
                    <h4>${contact.name}</h4>
                    <span>${contact.phone}</span>
                </div>
            </div>
            <div class="call-actions">
                <button class="call-btn-action" onclick="startCall('${contact.name}', 'voice')">
                    <i class="fas fa-phone"></i>
                </button>
                <button class="video-btn" onclick="startCall('${contact.name}', 'video')">
                    <i class="fas fa-video"></i>
                </button>
                <button class="delete-btn" onclick="toggleFavorite(${contact.id})">
                    <i class="fas fa-star" style="color:#f1c40f;"></i>
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

// ---------- SEARCH ----------
function filterContacts(query) {
    const items = document.querySelectorAll('.contact-item');
    items.forEach(item => {
        const name = item.querySelector('h4').textContent.toLowerCase();
        item.style.display = name.includes(query) ? 'flex' : 'none';
    });
}

function filterCalls(query) {
    const items = document.querySelectorAll('.call-item');
    items.forEach(item => {
        const name = item.querySelector('h4').textContent.toLowerCase();
        item.style.display = name.includes(query) ? 'flex' : 'none';
    });
}

// ---------- CALL FUNCTIONS ----------
function startCall(name, type) {
    App.isCalling = true;
    App.currentCall = { name, type };
    
    const interface = document.getElementById('callInterface');
    interface.style.display = 'flex';
    
    document.getElementById('callerName').textContent = name;
    document.getElementById('callerAvatar').src = getAvatar(name);
    document.getElementById('callStatus').textContent = 'Calling...';
    document.getElementById('callStatus').style.color = '#f1c40f';
    
    // Show placeholder
    document.getElementById('callPlaceholder').style.display = 'flex';
    document.getElementById('remoteVideo').style.display = 'none';
    
    // Hide chat
    document.getElementById('callChat').style.display = 'none';
    
    // Simulate connection
    setTimeout(() => {
        document.getElementById('callStatus').textContent = 'Connected';
        document.getElementById('callStatus').style.color = '#2ecc71';
        document.getElementById('callPlaceholder').style.display = 'none';
        document.getElementById('remoteVideo').style.display = 'block';
        
        // Show notification
        showNotification('Call connected', 'success');
    }, 2000);
}

function endCall() {
    App.isCalling = false;
    App.currentCall = null;
    document.getElementById('callInterface').style.display = 'none';
    
    // Reset video
    document.getElementById('callPlaceholder').style.display = 'flex';
    document.getElementById('remoteVideo').style.display = 'none';
    document.getElementById('callChat').style.display = 'none';
}

function toggleMute() {
    App.isMuted = !App.isMuted;
    const btn = document.querySelector('.call-btn:first-child');
    if (App.isMuted) {
        btn.innerHTML = '<i class="fas fa-microphone-slash"></i><span>Muted</span>';
        btn.style.color = '#e74c3c';
    } else {
        btn.innerHTML = '<i class="fas fa-microphone"></i><span>Mute</span>';
        btn.style.color = '';
    }
}

function toggleVideo() {
    App.isVideoOn = !App.isVideoOn;
    const btn = document.querySelector('.call-btn:nth-child(2)');
    if (App.isVideoOn) {
        btn.innerHTML = '<i class="fas fa-video"></i><span>Video</span>';
        document.getElementById('localVideo').style.display = 'block';
    } else {
        btn.innerHTML = '<i class="fas fa-video-slash"></i><span>Video</span>';
        btn.style.color = '#e74c3c';
        document.getElementById('localVideo').style.display = 'none';
    }
}

function toggleSpeaker() {
    App.isSpeakerOn = !App.isSpeakerOn;
    const btn = document.querySelector('.call-btn:nth-child(3)');
    if (App.isSpeakerOn) {
        btn.innerHTML = '<i class="fas fa-volume-up"></i><span>Speaker</span>';
        btn.style.color = '#2ecc71';
    } else {
        btn.innerHTML = '<i class="fas fa-volume-off"></i><span>Speaker</span>';
        btn.style.color = '';
    }
}

function toggleChat() {
    const chat = document.getElementById('callChat');
    chat.style.display = chat.style.display === 'none' ? 'flex' : 'none';
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;
    
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'message sent';
    div.innerHTML = `
        <span>${message}</span>
        <small>${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</small>
    `;
    container.appendChild(div);
    input.value = '';
    container.scrollTop = container.scrollHeight;
}

function showMoreOptions() {
    // Show more options menu
    alert('More options: Transfer call, Add participant, Record call');
}

// ---------- NOTIFICATION ----------
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.classList.add('show');
    
    // Update notification content
    const text = notification.querySelector('.notification-text p');
    text.textContent = message;
    
    if (type === 'success') {
        notification.querySelector('.notification-icon i').style.color = '#2ecc71';
    }
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

function showIncomingCall() {
    const notification = document.getElementById('notification');
    notification.classList.add('show');
    document.querySelector('.notification-text h4').textContent = 'Incoming Call';
    document.querySelector('.notification-text p').textContent = 'Sarah Johnson is calling...';
}

function acceptCall() {
    document.getElementById('notification').classList.remove('show');
    startCall('Sarah Johnson', 'video');
}

function rejectCall() {
    document.getElementById('notification').classList.remove('show');
    showNotification('Call rejected', 'info');
}

// ---------- CONTACT FUNCTIONS ----------
function addContact() {
    showModal('Add Contact', `
        <div class="form-group">
            <label>Full Name</label>
            <input type="text" id="contactName" placeholder="Enter name">
        </div>
        <div class="form-group">
            <label>Phone Number</label>
            <input type="text" id="contactPhone" placeholder="+1 234 567 890">
        </div>
        <div class="form-group">
            <label>Email</label>
            <input type="email" id="contactEmail" placeholder="email@example.com">
        </div>
        <button class="btn-primary" onclick="saveContact()" style="margin-top:10px;">
            <i class="fas fa-save"></i> Save Contact
        </button>
    `);
}

function saveContact() {
    const name = document.getElementById('contactName').value;
    const phone = document.getElementById('contactPhone').value;
    
    if (!name || !phone) {
        alert('Please fill in name and phone number');
        return;
    }
    
    App.contacts.push({
        id: Date.now(),
        name: name,
        phone: phone,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3498db&color=fff`,
        favorite: false,
        status: 'online'
    });
    
    closeModal();
    renderContacts();
    renderFavorites();
    showNotification('Contact added successfully!', 'success');
}

function toggleFavorite(id) {
    const contact = App.contacts.find(c => c.id === id);
    if (contact) {
        contact.favorite = !contact.favorite;
        renderContacts();
        renderFavorites();
    }
}

function deleteCall(id) {
    if (confirm('Delete this call record?')) {
        App.calls = App.calls.filter(c => c.id !== id);
        renderCalls();
        showNotification('Call deleted', 'info');
    }
}

// ---------- SETTINGS ----------
function toggleTheme() {
    App.darkMode = !App.darkMode;
    const root = document.documentElement;
    if (App.darkMode) {
        root.style.setProperty('--bg-primary', '#ffffff');
        root.style.setProperty('--bg-secondary', '#f5f5f5');
        root.style.setProperty('--text-primary', '#0a0e1a');
        root.style.setProperty('--text-secondary', 'rgba(0,0,0,0.7)');
        root.style.setProperty('--border-color', 'rgba(0,0,0,0.1)');
        root.style.setProperty('--bg-card', 'rgba(0,0,0,0.05)');
        document.querySelector('.icon-btn i').className = 'fas fa-sun';
    } else {
        root.style.setProperty('--bg-primary', '#0a0e1a');
        root.style.setProperty('--bg-secondary', '#1a1a2e');
        root.style.setProperty('--text-primary', '#ffffff');
        root.style.setProperty('--text-secondary', 'rgba(255,255,255,0.7)');
        root.style.setProperty('--border-color', 'rgba(255,255,255,0.1)');
        root.style.setProperty('--bg-card', 'rgba(255,255,255,0.05)');
        document.querySelector('.icon-btn i').className = 'fas fa-moon';
    }
}

function showSettings() {
    document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
    document.querySelector('[data-tab="settings"]').classList.add('active');
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById('settingsSection').classList.add('active');
}

// ---------- MODAL ----------
function showModal(title, bodyHTML) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    document.getElementById('modal').classList.add('show');
}

function closeModal() {
    document.getElementById('modal').classList.remove('show');
}

// ---------- UTILITY ----------
function getAvatar(name) {
    const contact = App.contacts.find(c => c.name === name);
    return contact ? contact.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f7971e&color=fff`;
}

function startNewCall() {
    showModal('New Call', `
        <div class="form-group">
            <label>Contact Name</label>
            <input type="text" id="callContact" placeholder="Search or enter name" list="contactList">
            <datalist id="contactList">
                ${App.contacts.map(c => `<option value="${c.name}">`).join('')}
            </datalist>
        </div>
        <div style="display:flex;gap:10px;margin-top:10px;">
            <button class="btn-primary" onclick="startCallFromModal('voice')" style="flex:1;">
                <i class="fas fa-phone"></i> Voice Call
            </button>
            <button class="btn-primary" onclick="startCallFromModal('video')" style="flex:1;">
                <i class="fas fa-video"></i> Video Call
            </button>
        </div>
    `);
}

function startCallFromModal(type) {
    const name = document.getElementById('callContact').value;
    if (!name) {
        alert('Please enter a contact name');
        return;
    }
    closeModal();
    startCall(name, type);
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('procall_user');
        window.location.href = 'login.html';
    }
}

// ---------- KEYBOARD SHORTCUTS ----------
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (document.getElementById('callInterface').style.display !== 'none') {
            endCall();
        }
        if (document.getElementById('modal').classList.contains('show')) {
            closeModal();
        }
    }
});

// ---------- SIMULATE INCOMING CALL ----------
setTimeout(() => {
    showIncomingCall();
}, 5000);

// Make functions globally accessible
window.startCall = startCall;
window.endCall = endCall;
window.toggleMute = toggleMute;
window.toggleVideo = toggleVideo;
window.toggleSpeaker = toggleSpeaker;
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;
window.showMoreOptions = showMoreOptions;
window.addContact = addContact;
window.saveContact = saveContact;
window.toggleFavorite = toggleFavorite;
window.deleteCall = deleteCall;
window.toggleTheme = toggleTheme;
window.showSettings = showSettings;
window.startNewCall = startNewCall;
window.startCallFromModal = startCallFromModal;
window.logout = logout;
window.showNotification = showNotification;
window.closeModal = closeModal;
window.showModal = showModal;
window.acceptCall = acceptCall;
window.rejectCall = rejectCall;
window.renderCalls = renderCalls;
window.renderContacts = renderContacts;
window.renderFavorites = renderFavorites;
window.filterContacts = filterContacts;
window.filterCalls = filterCalls;
window.searchContacts = function() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    filterContacts(query);
    filterCalls(query);
};
