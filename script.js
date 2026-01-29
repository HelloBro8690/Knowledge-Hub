// Demo users (use localStorage for persistence)
const demoUsers = { student: { role: 'student', pass: 'student' }, teacher: { role: 'teacher', pass: 'teacher' } };

// Current user
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
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById(currentUser.role + 'Dash').classList.add('active');
    if (currentUser.role === 'student') loadStudentDoubts();
    else loadTeacherDoubts();
}

// Logout
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('loginScreen').classList.add('active');
}

// Subject click
document.querySelectorAll('.subject-card').forEach(card => {
    card.addEventListener('click', () => {
        currentSubject = card.dataset.subject;
        document.getElementById('postDoubtSection').classList.remove('hidden');
    });
});

// Post doubt (anonymous)
function postDoubt() {
    const text = document.getElementById('doubtText').value;
    if (!text || !currentSubject) return;
    const doubts = JSON.parse(localStorage.getItem('doubts') || '[]');
    doubts.push({ id: Date.now(), subject: currentSubject, text, timestamp: new Date().toLocaleString(), answered: false });
    localStorage.setItem('doubts', JSON.stringify(doubts));
    document.getElementById('doubtText').value = '';
    loadStudentDoubts();
}

// Load student doubts/answers
function loadStudentDoubts() {
    const doubts = JSON.parse(localStorage.getItem('doubts') || '[]');
    const list = document.getElementById('answersList');
    list.innerHTML = doubts.map(d => `
        <div class="doubt-item">
            <strong>${d.subject.toUpperCase()}</strong> - ${d.text}
            <br><small>${d.timestamp}</small>
            ${d.answer ? `
                <div class="answer-item">
                    <p>${d.answer.text}</p>
                    ${d.answer.video && `<iframe class="answer-video" src="${d.answer.video}" frameborder="0" allowfullscreen></iframe>`}
                    <div class="rating-stars" data-id="${d.id}">★★★★★</div>
                    <small>Avg Rating: ${d.avgRating || 0}/5 (${d.ratings?.length || 0} votes)</small>
                </div>
            ` : '<p>Awaiting answer...</p>'}
        </div>
    `).join('');
    addRatingListeners();
}

// Load teacher doubts
function loadTeacherDoubts() {
    const doubts = JSON.parse(localStorage.getItem('doubts') || '[]');
    const list = document.getElementById('doubtsList');
    list.innerHTML = doubts.filter(d => !d.answered).map(d => {
        return `
            <div class="doubt-item">
                <strong>${d.subject.toUpperCase()}</strong> - ${d.text}
                <br><small>${d.timestamp}</small>
                <textarea id="reply-${d.id}" placeholder="Reply here..."></textarea>
                <input id="video-${d.id}" placeholder="YouTube URL (optional)">
                <button onclick="answerDoubt(${d.id})">Answer</button>
            </div>
        `;
    }).join('') || '<p>No new doubts.</p>';
}

// Answer doubt
function answerDoubt(id) {
    const reply = document.getElementById(`reply-${id}`).value;
    const video = document.getElementById(`video-${id}`).value;
    if (!reply) return;
    const doubts = JSON.parse(localStorage.getItem('doubts') || '[]');
    const doubt = doubts.find(d => d.id === id);
    doubt.answer = { text: reply, video };
    doubt.answered = true;
    localStorage.setItem('doubts', JSON.stringify(doubts));
    loadTeacherDoubts();
    loadStudentDoubts();
}

// Rating
function addRatingListeners() {
    document.querySelectorAll('.rating-stars').forEach(stars => {
        stars.addEventListener('click', (e) => {
            const id = stars.dataset.id;
            const rating = Array.from(stars.children).indexOf(e.target) + 1;
            let doubts = JSON.parse(localStorage.getItem('doubts') || '[]');
            let d = doubts.find(d => d.id == id);
            if (!d.ratings) d.ratings = [];
            d.ratings.push(rating);
            d.avgRating = d.ratings.reduce((a,b)=>a+b)/d.ratings.length;
            localStorage.setItem('doubts', JSON.stringify(doubts));
            loadStudentDoubts(); // Reload to update
        });
        stars.addEventListener('mouseover', (e) => {
            const starsList = stars.children;
            for (let i = 0; i < starsList.length; i++) {
                starsList[i].classList.toggle('filled', i < Array.from(stars.children).indexOf(e.target) + 1);
            }
        });
        stars.addEventListener('mouseout', () => {
            const id = stars.dataset.id;
            let doubts = JSON.parse(localStorage.getItem('doubts') || '[]');
            let d = doubts.find(d => d.id == id);
            const avg = Math.round(d.avgRating || 0);
            const starsList = stars.children;
            for (let i = 0; i < starsList.length; i++) {
                starsList[i].classList.toggle('filled', i < avg);
            }
        });
    });
}

// Init
if (localStorage.getItem('currentUser')) {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
    showDashboard();
}
