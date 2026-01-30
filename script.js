// Demo users
const demoUsers = { 
    student: { role: 'student', pass: 'student' }, 
    teacher: { role: 'teacher', pass: 'teacher' } 
};

let currentUser = null;
let currentSubject = '';

// Role switch
function switchRole(role) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('loginForm').dataset.role = role;
}

// Login
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const role = document.getElementById('loginForm').dataset.role;
    if (demoUsers[user] && demoUsers[user].pass === pass && demoUsers[user].role === role) {
        currentUser = { name: user, role };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showDashboard();
    } else {
        alert('Invalid credentials. Use demo: student/student or teacher/teacher');
    }
});

// Show dashboard
function showDashboard() {
    const loginScreen = document.getElementById('loginScreen');
    let dashboard;
    
    if (currentUser.role === 'student') {
        dashboard = document.getElementById('studentHome');
    } else {
        dashboard = document.getElementById('teacherDash');
    }
    
    loginScreen.classList.remove('active');
    setTimeout(() => {
        dashboard.classList.add('active');
        if (currentUser.role === 'student') {
            loadStudentStats();
            loadStudentClasses();
            loadStudentNotes();
            loadStudentDoubts();
        } else {
            loadTeacherStats();
            loadTeacherClasses();
            loadTeacherNotes();
            loadTeacherDoubts();
        }
    }, 300);
}

// Logout
function logout() {
    const screens = document.querySelectorAll('.screen.active');
    screens.forEach(s => s.classList.remove('active'));
    
    setTimeout(() => {
        currentUser = null;
        localStorage.removeItem('currentUser');
        document.getElementById('loginScreen').classList.add('active');
    }, 300);
}

// ============ STUDENT FUNCTIONS ============

// Student Tab Switching
function switchStudentTab(tab) {
    document.querySelectorAll('#studentHome .nav-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    document.querySelectorAll('#studentHome .tab-content').forEach(content => content.classList.remove('active'));
    
    let tabId;
    if (tab === 'home') tabId = 'studentHomeTab';
    else if (tab === 'doubts') tabId = 'studentDoubtsTab';
    else if (tab === 'classes') tabId = 'studentClassesTab';
    else if (tab === 'notes') tabId = 'studentNotesTab';
    
    document.getElementById(tabId).classList.add('active');
}

// Subject click - shows doubt posting form
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.subject-card').forEach(card => {
        card.addEventListener('click', () => {
            if (!currentUser || currentUser.role !== 'student') return;
            currentSubject = card.dataset.subject;
            const section = document.getElementById('postDoubtSection');
            section.classList.remove('hidden');
            section.classList.add('show');
            setTimeout(() => section.scrollIntoView({ behavior: 'smooth' }), 100);
        });
    });
});

// Post doubt
function postDoubt() {
    const text = document.getElementById('doubtText').value;
    if (!text || !currentSubject) {
        alert('Please select a subject and enter your doubt');
        return;
    }
    const doubts = JSON.parse(localStorage.getItem('doubts') || '[]');
    doubts.push({ 
        id: Date.now(), 
        subject: currentSubject, 
        text, 
        timestamp: new Date().toLocaleString(), 
        answered: false 
    });
    localStorage.setItem('doubts', JSON.stringify(doubts));
    document.getElementById('doubtText').value = '';
    loadStudentDoubts();
    alert('Doubt posted successfully!');
}

// Load student home stats
function loadStudentStats() {
    const doubts = JSON.parse(localStorage.getItem('doubts') || '[]');
    const classes = JSON.parse(localStorage.getItem('classes') || '[]');
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    
    document.getElementById('doubtCount').textContent = doubts.length;
    document.getElementById('classCount').textContent = classes.length;
    document.getElementById('notesCount').textContent = notes.length;
}

// Load student doubts
function loadStudentDoubts() {
    const doubts = JSON.parse(localStorage.getItem('doubts') || '[]');
    const list = document.getElementById('answersList');
    
    if (doubts.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>No doubts yet. Select a subject and post your first doubt!</p></div>';
        return;
    }
    
    list.innerHTML = doubts.map(d => `
        <div class="doubt-item">
            <strong>${d.subject}</strong> <span style="opacity: 0.7; font-size: 12px;">${d.timestamp}</span>
            <p style="margin: 10px 0;">${d.text}</p>
            ${d.answer ? `
                <div class="answer-item">
                    <h4>Teacher's Answer:</h4>
                    <p>${d.answer.text}</p>
                    ${d.answer.video ? `<iframe class="answer-video" src="${d.answer.video}" frameborder="0" allowfullscreen></iframe>` : ''}
                    <div class="rating-stars" data-id="${d.id}">★★★★★</div>
                    <small>Rating: ${d.avgRating ? d.avgRating.toFixed(1) : 'Not rated yet'}/5</small>
                </div>
            ` : '<p style="color: #feca57;">⏳ Waiting for teacher response...</p>'}
        </div>
    `).join('');
    addRatingListeners();
}

// Load student classes
function loadStudentClasses() {
    const classes = JSON.parse(localStorage.getItem('classes') || '[]');
    const list = document.getElementById('studentClassesList');
    
    if (classes.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>No video classes available yet.</p></div>';
        return;
    }
    
    list.innerHTML = classes.map(c => `
        <div class="class-card">
            <div class="class-title">${c.title}</div>
            <div class="class-subject">${c.subject}</div>
            <p class="class-description">${c.description || 'No description'}</p>
            <div class="class-actions">
                <button class="btn-action" onclick="openVideo('${c.videoUrl}')">▶ Watch</button>
                <button class="btn-action" onclick="downloadClass(${c.id})">⬇ Details</button>
            </div>
        </div>
    `).join('');
}

// Load student notes
function loadStudentNotes() {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const list = document.getElementById('studentNotesList');
    
    if (notes.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>No study materials available yet.</p></div>';
        return;
    }
    
    list.innerHTML = notes.map(n => `
        <div class="note-card">
            <div class="note-title">${n.title}</div>
            <div class="note-subject">${n.subject}</div>
            <p class="note-description">${n.description || 'No description'}</p>
            <div class="note-actions">
                <button class="btn-action" onclick="downloadNote(${n.id})">⬇ Download</button>
                <button class="btn-action" onclick="viewNote(${n.id})">👁 Preview</button>
            </div>
        </div>
    `).join('');
}

// ============ TEACHER FUNCTIONS ============

// Teacher Tab Switching
function switchTeacherTab(tab) {
    document.querySelectorAll('#teacherDash .nav-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    document.querySelectorAll('#teacherDash .tab-content').forEach(content => content.classList.remove('active'));
    const tabId = tab === 'home' ? 'teacherHomeTab' : 
                  tab === 'doubts' ? 'teacherDoubtsTab' :
                  tab === 'classes' ? 'teacherClassesTab' :
                  'teacherNotesTab';
    document.getElementById(tabId).classList.add('active');
}

// Load teacher stats
function loadTeacherStats() {
    const doubts = JSON.parse(localStorage.getItem('doubts') || '[]');
    const classes = JSON.parse(localStorage.getItem('classes') || '[]');
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    
    const pending = doubts.filter(d => !d.answered).length;
    document.getElementById('pendingDoubts').textContent = pending;
    document.getElementById('uploadedClasses').textContent = classes.length;
    document.getElementById('uploadedNotes').textContent = notes.length;
}

// Load teacher doubts
function loadTeacherDoubts() {
    const doubts = JSON.parse(localStorage.getItem('doubts') || '[]');
    const list = document.getElementById('doubtsList');
    const pending = doubts.filter(d => !d.answered);
    
    if (pending.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>No pending doubts!</p></div>';
        return;
    }
    
    list.innerHTML = pending.map(d => `
        <div class="doubt-item">
            <strong>${d.subject}</strong> <span style="opacity: 0.7; font-size: 12px;">${d.timestamp}</span>
            <p style="margin: 10px 0;">${d.text}</p>
            <textarea id="reply-${d.id}" placeholder="Write your answer..." style="margin: 10px 0; min-height: 80px;"></textarea>
            <input type="text" id="video-${d.id}" placeholder="YouTube Video URL (optional)" style="margin: 10px 0;">
            <button class="btn-primary" onclick="answerDoubt(${d.id})">✓ Submit Answer</button>
        </div>
    `).join('');
}

// Answer doubt
function answerDoubt(id) {
    const reply = document.getElementById(`reply-${id}`).value;
    const video = document.getElementById(`video-${id}`).value;
    
    if (!reply.trim()) {
        alert('Please write an answer');
        return;
    }
    
    const doubts = JSON.parse(localStorage.getItem('doubts') || '[]');
    const doubt = doubts.find(d => d.id === id);
    
    if (doubt) {
        doubt.answer = { text: reply, video };
        doubt.answered = true;
        localStorage.setItem('doubts', JSON.stringify(doubts));
        loadTeacherDoubts();
        alert('Answer posted successfully!');
    }
}

// Upload class
function uploadClass() {
    const title = document.getElementById('classTitle').value;
    const subject = document.getElementById('classSubject').value;
    const description = document.getElementById('classDescription').value;
    const videoUrl = document.getElementById('classVideoUrl').value;
    
    if (!title || !subject || !videoUrl) {
        alert('Please fill in all required fields');
        return;
    }
    
    const classes = JSON.parse(localStorage.getItem('classes') || '[]');
    classes.push({
        id: Date.now(),
        title,
        subject,
        description,
        videoUrl,
        uploadedAt: new Date().toLocaleString()
    });
    localStorage.setItem('classes', JSON.stringify(classes));
    
    document.getElementById('classTitle').value = '';
    document.getElementById('classSubject').value = '';
    document.getElementById('classDescription').value = '';
    document.getElementById('classVideoUrl').value = '';
    
    loadTeacherClasses();
    loadTeacherStats();
    alert('Class uploaded successfully!');
}

// Go Live
function goLive() {
    alert('🔴 Live streaming would be configured here. For now, upload video URLs or join a video conference platform.');
}

// Load teacher classes
function loadTeacherClasses() {
    const classes = JSON.parse(localStorage.getItem('classes') || '[]');
    const list = document.getElementById('teacherClassesList');
    
    if (classes.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>No classes uploaded yet.</p></div>';
        return;
    }
    
    list.innerHTML = classes.map(c => `
        <div class="class-card">
            <div class="class-title">${c.title}</div>
            <div class="class-subject">${c.subject}</div>
            <p class="class-description">${c.description || 'No description'}</p>
            <small style="opacity: 0.7;">Uploaded: ${c.uploadedAt}</small>
            <div class="class-actions" style="margin-top: 10px;">
                <button class="btn-action" onclick="editClass(${c.id})">✏ Edit</button>
                <button class="btn-action" onclick="deleteClass(${c.id})">🗑 Delete</button>
            </div>
        </div>
    `).join('');
}

// Delete class
function deleteClass(id) {
    if (!confirm('Delete this class?')) return;
    const classes = JSON.parse(localStorage.getItem('classes') || '[]');
    const filtered = classes.filter(c => c.id !== id);
    localStorage.setItem('classes', JSON.stringify(filtered));
    loadTeacherClasses();
    loadTeacherStats();
}

// Upload notes
function uploadNotes() {
    const title = document.getElementById('notesTitle').value;
    const subject = document.getElementById('notesSubject').value;
    const description = document.getElementById('notesDescription').value;
    const file = document.getElementById('notesFile').files[0];
    
    if (!title || !subject || !file) {
        alert('Please fill in all required fields');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        notes.push({
            id: Date.now(),
            title,
            subject,
            description,
            fileName: file.name,
            fileData: e.target.result,
            uploadedAt: new Date().toLocaleString()
        });
        localStorage.setItem('notes', JSON.stringify(notes));
        
        document.getElementById('notesTitle').value = '';
        document.getElementById('notesSubject').value = '';
        document.getElementById('notesDescription').value = '';
        document.getElementById('notesFile').value = '';
        
        loadTeacherNotes();
        loadTeacherStats();
        alert('Material uploaded successfully!');
    };
    reader.readAsDataURL(file);
}

// Load teacher notes
function loadTeacherNotes() {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const list = document.getElementById('teacherNotesList');
    
    if (notes.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>No materials uploaded yet.</p></div>';
        return;
    }
    
    list.innerHTML = notes.map(n => `
        <div class="note-card">
            <div class="note-title">${n.title}</div>
            <div class="note-subject">${n.subject}</div>
            <p class="note-description">${n.description || 'No description'}</p>
            <small style="opacity: 0.7;">File: ${n.fileName}</small><br>
            <small style="opacity: 0.7;">Uploaded: ${n.uploadedAt}</small>
            <div class="note-actions" style="margin-top: 10px;">
                <button class="btn-action" onclick="deleteNote(${n.id})">🗑 Delete</button>
            </div>
        </div>
    `).join('');
}

// Delete note
function deleteNote(id) {
    if (!confirm('Delete this material?')) return;
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const filtered = notes.filter(n => n.id !== id);
    localStorage.setItem('notes', JSON.stringify(filtered));
    loadTeacherNotes();
    loadTeacherStats();
}

// Helper functions
function openVideo(url) {
    if (url.includes('youtube')) {
        window.open(url, '_blank');
    } else {
        alert('Video URL: ' + url);
    }
}

function downloadClass(id) {
    const classes = JSON.parse(localStorage.getItem('classes') || '[]');
    const c = classes.find(x => x.id === id);
    if (c) {
        alert(`Class: ${c.title}\nSubject: ${c.subject}\nVideo: ${c.videoUrl}`);
    }
}

function downloadNote(id) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const n = notes.find(x => x.id === id);
    if (n && n.fileData) {
        const link = document.createElement('a');
        link.href = n.fileData;
        link.download = n.fileName;
        link.click();
    }
}

function viewNote(id) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const n = notes.find(x => x.id === id);
    if (n) {
        alert(`${n.title}\n\n${n.description || 'No description'}\n\nFile: ${n.fileName}`);
    }
}

// Rating system
function addRatingListeners() {
    document.querySelectorAll('.rating-stars').forEach(stars => {
        const starEls = stars.querySelectorAll('.star') || Array.from(stars.textContent.split('')).map((s, i) => {
            const el = document.createElement('span');
            el.className = 'star';
            el.textContent = s;
            el.style.cursor = 'pointer';
            return el;
        });
        
        if (!stars.querySelectorAll('.star').length) {
            stars.innerHTML = '★★★★★'.split('').map((s, i) => 
                `<span class="star" data-idx="${i}">${s}</span>`
            ).join('');
        }
        
        stars.querySelectorAll('.star').forEach((star, idx) => {
            star.addEventListener('click', () => {
                const id = parseInt(stars.dataset.id);
                const rating = idx + 1;
                const doubts = JSON.parse(localStorage.getItem('doubts') || '[]');
                const d = doubts.find(d => d.id === id);
                if (d) {
                    if (!d.ratings) d.ratings = [];
                    d.ratings.push(rating);
                    d.avgRating = d.ratings.reduce((a, b) => a + b) / d.ratings.length;
                    localStorage.setItem('doubts', JSON.stringify(doubts));
                    loadStudentDoubts();
                    alert('Thank you for rating!');
                }
            });
        });
    });
}

// Init
if (localStorage.getItem('currentUser')) {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
    showDashboard();
}
