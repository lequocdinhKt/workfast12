// main.js — WorkFast

// ── Trạng thái người dùng hiện tại ────────────────
// currentUser.type === 'business' | 'worker' | null (chưa đăng nhập)
var currentUser = JSON.parse(localStorage.getItem('wf_user') || 'null');

function getApiBaseUrl() {
    // Allow quick override for demo: localStorage.setItem('wf_api_base', 'https://your-api-domain.com')
    var override = localStorage.getItem('wf_api_base');
    if (override) return override.replace(/\/$/, '');

    var isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocal ? 'http://localhost:3001' : window.location.origin;
}

var API_BASE_URL = getApiBaseUrl();

function readDemoUsers() {
    try {
        return JSON.parse(localStorage.getItem('wf_demo_users') || '[]');
    } catch (e) {
        return [];
    }
}

function writeDemoUsers(users) {
    localStorage.setItem('wf_demo_users', JSON.stringify(users));
}

function safeUser(user) {
    var clone = {};
    Object.keys(user).forEach(function (key) {
        if (key !== 'password') clone[key] = user[key];
    });
    return clone;
}

function handleDemoAuth(endpoint, data) {
    var users = readDemoUsers();

    if (endpoint === '/api/login') {
        var found = users.find(function (u) {
            return u.email === data.email && u.password === data.password;
        });

        if (!found) {
            return { ok: false, message: 'Email hoặc mật khẩu không đúng.' };
        }

        return {
            ok: true,
            message: 'Đăng nhập thành công! (Demo offline)',
            user: safeUser(found)
        };
    }

    if (endpoint === '/api/register' || endpoint === '/api/register-worker') {
        if (!data.email || !data.password) {
            return { ok: false, message: 'Thiếu email hoặc mật khẩu.' };
        }

        if (users.find(function (u) { return u.email === data.email; })) {
            return { ok: false, message: 'Email đã được đăng ký.' };
        }

        var type = endpoint === '/api/register-worker' ? 'worker' : 'business';
        var newUser = {
            id: Date.now(),
            type: type,
            fullName: data.fullName || '',
            email: data.email,
            phone: data.phone || '',
            password: data.password,
            idNumber: data.idNumber || '',
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        writeDemoUsers(users);

        return {
            ok: true,
            message: type === 'worker' ? 'Đăng ký lao động thành công! (Demo offline)' : 'Đăng ký doanh nghiệp thành công! (Demo offline)'
        };
    }

    return { ok: false, message: 'Không hỗ trợ endpoint demo này.' };
}

function submitAuthRequest(endpoint, data) {
    return fetch(API_BASE_URL + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(function (r) {
        return r.json().catch(function () {
            return { ok: false, message: 'Phản hồi từ máy chủ không hợp lệ.' };
        });
    })
    .catch(function () {
        return handleDemoAuth(endpoint, data);
    });
}

function setCurrentUser(user) {
    currentUser = user;
    if (user) {
        localStorage.setItem('wf_user', JSON.stringify(user));
    } else {
        localStorage.removeItem('wf_user');
    }
}

function isLoggedIn()   { return !!currentUser; }
function isBusiness()   { return currentUser && currentUser.type === 'business'; }
function isWorker()     { return currentUser && currentUser.type === 'worker'; }

document.addEventListener('DOMContentLoaded', function () {

    // ── Iframe resize ──────────────────────────────
    var iframe = document.getElementById('homeFrame');
    if (iframe) {
        iframe.addEventListener('load', function () {
            try {
                var h = iframe.contentWindow.document.body.scrollHeight;
                iframe.style.height = h + 'px';
            } catch (e) {
                iframe.style.height = '2000px';
            }
        });
    }

    // ── Helper: setup a modal ──────────────────────
    function setupModal(overlayId, closeBtnId, formId, photoInputIds) {
        var overlay  = document.getElementById(overlayId);
        var closeBtn = document.getElementById(closeBtnId);
        var form     = document.getElementById(formId);
        if (!overlay) return null;

        function open() {
            overlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        function close() {
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        }

        if (closeBtn) closeBtn.addEventListener('click', close);

        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) close();
        });

        // ID photo preview
        photoInputIds.forEach(function (id) {
            var input = document.getElementById(id);
            if (!input) return;
            input.addEventListener('change', function () {
                var file = this.files[0];
                if (!file) return;
                var box = this.closest('.reg-id-box');
                var existing = box.querySelector('img');
                if (existing) existing.remove();
                var icon = box.querySelector('.reg-id-icon');
                if (icon) icon.style.display = 'none';
                var img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.alt = 'Preview';
                img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';
                box.appendChild(img);
            });
        });

        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                var endpoint = form.dataset.endpoint;
                if (!endpoint) { alert('Đăng ký thành công!'); close(); return; }

                var data = {};
                Array.from(form.elements).forEach(function (el) {
                    if (el.name && el.type !== 'file') data[el.name] = el.value;
                });

                if (data.confirmPassword && data.password !== data.confirmPassword) {
                    alert('Mật khẩu xác nhận không khớp.');
                    return;
                }

                submitAuthRequest(endpoint, data)
                .then(function (res) {
                    alert(res.message);
                    if (res.ok) {
                        form.reset();
                        // Lưu thông tin đăng nhập vào currentUser
                        if (res.user) setCurrentUser(res.user);
                        close();
                        // Điều hướng theo loại tài khoản
                        if (res.user && res.user.type === 'worker') {
                            window.location.href = 'html/worker-home.html';
                        } else if (res.user && res.user.type === 'business') {
                            window.location.href = 'html/business-home.html';
                        }
                    }
                })
                .catch(function () {
                    alert('Đăng ký/đăng nhập thất bại. Vui lòng thử lại.');
                });
            });
        }

        return { open: open, close: close };
    }

    // ── Setup Login modal ─────────────────────────
    var loginModal = setupModal(
        'loginOverlay', 'loginCloseBtn', 'loginForm', []
    );

    // Header "Log In" button
    var btnLogin = document.querySelector('.btn-login');
    if (btnLogin && loginModal) {
        btnLogin.addEventListener('click', function (e) {
            e.preventDefault();
            loginModal.open();
        });
    }

    // "Đăng ký ngay" link inside login modal → open biz modal
    var switchBtn = document.getElementById('loginSwitchRegister');
    if (switchBtn) {
        switchBtn.addEventListener('click', function (e) {
            e.preventDefault();
            loginModal.close();
            if (bizModal) bizModal.open();
        });
    }

    // ── Setup Doanh Nghiệp modal ───────────────────
    var bizModal = setupModal(
        'registrationOverlay', 'regCloseBtn', 'registrationForm',
        ['regIdFront', 'regIdBack']
    );

    // ── Setup Lao Động modal ───────────────────────
    var workerModal = setupModal(
        'workerOverlay', 'workerCloseBtn', 'workerForm',
        ['wIdFront', 'wIdBack']
    );

    // ── Header "Đăng ký" button (Doanh Nghiệp) ────
    var btnOpen = document.getElementById('btnOpenRegister');
    if (btnOpen && bizModal) {
        btnOpen.addEventListener('click', function (e) {
            e.preventDefault();
            bizModal.open();
        });
    }

    // ── postMessage from iframe ────────────────────
    window.addEventListener('message', function (e) {
        if (!e.data) return;
        if (e.data.type === 'openRegistration' && bizModal) bizModal.open();
        if (e.data.type === 'openWorkerRegistration' && workerModal) workerModal.open();
    });

    // ── Escape closes any open modal ──────────────
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        var biz    = document.getElementById('registrationOverlay');
        var worker = document.getElementById('workerOverlay');
        if (biz    && biz.style.display    === 'flex') { biz.style.display    = 'none'; document.body.style.overflow = ''; }
        if (worker && worker.style.display === 'flex') { worker.style.display = 'none'; document.body.style.overflow = ''; }
    });

});
