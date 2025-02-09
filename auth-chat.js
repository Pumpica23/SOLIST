// auth.js
const AuthModule = {
    init() {
        this.checkAuthState();
        this.setupEventListeners();
    },

    checkAuthState() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const loginForm = document.getElementById('loginForm');
        const container = document.querySelector('.container');
        const botElement = document.querySelector('#qodo-chat-button');
        const botIframe = document.querySelector('#qodo-chat-iframe');
        
        if (!isLoggedIn) {
            loginForm.classList.add('active');
            container.style.display = 'none';
            if (botElement) botElement.style.display = 'none';
            if (botIframe) botIframe.style.display = 'none';
        } else {
            loginForm.classList.remove('active');
            container.style.display = 'block';
            if (botElement) botElement.style.display = 'block';
            if (botIframe) botIframe.style.display = 'block';
        }
    },

    setupEventListeners() {
        const loginForm = document.getElementById('login');
        loginForm.addEventListener('submit', this.handleLogin.bind(this));
        
        // Clear auth state on page load
        localStorage.removeItem('isLoggedIn');
        this.checkAuthState();
    },

    handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('errorMessage');

        const users = {
            'admin': '148',
            'Marko': 'M',
            'Brane': 'B',
            'Kristina': 'K',
            'Sven': 'S',
            'Matic': 'M',
            'Anastazija': 'A',
            'David': 'D',
            'Lana': 'L',
            'Julija': 'J',
            'Maddy': 'M',
            'Viktor': 'V',
        };

        if (users[username] && users[username] === password) {
            localStorage.setItem('isLoggedIn', 'true');
            document.getElementById('loginForm').classList.remove('active');
            document.querySelector('.container').style.display = 'block';
            
            // Show bot elements after successful login
            const botElement = document.querySelector('#qodo-chat-button');
            const botIframe = document.querySelector('#qodo-chat-iframe');
            if (botElement) botElement.style.display = 'block';
            if (botIframe) botIframe.style.display = 'block';
            
            errorMessage.style.display = 'none';
        } else {
            errorMessage.textContent = 'Napačno uporabniško ime ali geslo.';
            errorMessage.style.display = 'block';
        }
    },

    logout() {
        localStorage.removeItem('isLoggedIn');
        this.checkAuthState();
    }
};

// Initialize the auth module when the page loads
document.addEventListener('DOMContentLoaded', () => {
    AuthModule.init();
});