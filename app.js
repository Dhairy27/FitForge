// HealthVerse AI - App Logic

document.addEventListener('DOMContentLoaded', () => {
    console.log('HealthVerse AI initialized.');

    // Page detection
    const path = window.location.pathname.toLowerCase();
    const isLoginPage = path.includes('login.html') || path.endsWith('/login') || path.endsWith('/login/');
    const isSignupPage = path.includes('signup.html') || path.endsWith('/signup') || path.endsWith('/signup/');

    if (isLoginPage) {
        initLoginPage();
    } else if (isSignupPage) {
        initSignupPage();
    } else {
        initLandingPage();
    }
});

function initLandingPage() {
    console.log('Landing page active.');
}

function initLoginPage() {
    console.log('Login page active.');
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            alert(`Welcome back! Logged in successfully as: ${email}`);
            window.location.href = 'index.html';
        });
    }

    const googleBtn = document.getElementById('google-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            alert('Google authentication triggered!');
        });
    }
}

function initSignupPage() {
    console.log('Signup page active.');
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            alert(`Account created successfully for: ${email}! Calibrating baseline biometrics...`);
            window.location.href = 'index.html';
        });
    }

    const googleBtn = document.getElementById('google-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            alert('Google sign up triggered!');
        });
    }
}
