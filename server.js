// server.js — WorkFast API server
const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

const app      = express();
const PORT     = 3001;
const DB_PATH  = path.join(__dirname, 'data', 'users.json');

app.use(cors());
app.use(express.json());

// Serve static files (index.html, css, js, etc.)
app.use(express.static(__dirname));

// ── Helpers ──────────────────────────────────────
function readUsers() {
    try {
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch {
        return [];
    }
}

function writeUsers(users) {
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2), 'utf8');
}

// ── POST /api/register  (Doanh Nghiệp) ───────────
app.post('/api/register', (req, res) => {
    const { email, phone, password, idNumber } = req.body;
    if (!email || !password) {
        return res.status(400).json({ ok: false, message: 'Thiếu email hoặc mật khẩu.' });
    }

    const users = readUsers();
    if (users.find(u => u.email === email)) {
        return res.status(409).json({ ok: false, message: 'Email đã được đăng ký.' });
    }

    const user = {
        id: Date.now(),
        type: 'business',
        email,
        phone: phone || '',
        password,          // plain-text for demo; use bcrypt in production
        idNumber: idNumber || '',
        createdAt: new Date().toISOString()
    };
    users.push(user);
    writeUsers(users);
    res.json({ ok: true, message: 'Đăng ký doanh nghiệp thành công!' });
});

// ── POST /api/register-worker  (Lao Động) ────────
app.post('/api/register-worker', (req, res) => {
    const { fullName, email, phone, password, idNumber } = req.body;
    if (!email || !password) {
        return res.status(400).json({ ok: false, message: 'Thiếu email hoặc mật khẩu.' });
    }

    const users = readUsers();
    if (users.find(u => u.email === email)) {
        return res.status(409).json({ ok: false, message: 'Email đã được đăng ký.' });
    }

    const user = {
        id: Date.now(),
        type: 'worker',
        fullName: fullName || '',
        email,
        phone: phone || '',
        password,
        idNumber: idNumber || '',
        createdAt: new Date().toISOString()
    };
    users.push(user);
    writeUsers(users);
    res.json({ ok: true, message: 'Đăng ký lao động thành công!' });
});

// ── POST /api/login ───────────────────────────────
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ ok: false, message: 'Thiếu email hoặc mật khẩu.' });
    }

    const users = readUsers();
    const user  = users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(401).json({ ok: false, message: 'Email hoặc mật khẩu không đúng.' });
    }

    const { password: _, ...safeUser } = user;
    res.json({ ok: true, message: 'Đăng nhập thành công!', user: safeUser });
});

// ── GET /api/users  (danh sách, chỉ dùng cho demo) ─
app.get('/api/users', (req, res) => {
    const users = readUsers().map(({ password: _, ...u }) => u);
    res.json(users);
});

// ── GET /api/jobs  (danh sách việc làm, hỗ trợ filter) ─
const JOBS_PATH = path.join(__dirname, 'data', 'jobs.json');
app.get('/api/jobs', (req, res) => {
    let jobs;
    try { jobs = JSON.parse(fs.readFileSync(JOBS_PATH, 'utf8')); }
    catch { return res.json([]); }

    const { q, city, type } = req.query;
    if (q)    jobs = jobs.filter(j => j.title.toLowerCase().includes(q.toLowerCase()) || j.company.toLowerCase().includes(q.toLowerCase()));
    if (city) jobs = jobs.filter(j => j.city === city);
    if (type) jobs = jobs.filter(j => j.type === type);

    res.json(jobs);
});

app.listen(PORT, () => {
    console.log(`WorkFast API running at http://localhost:${PORT}`);
});
