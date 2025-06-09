/**
 * Authentication module for handling login and registration
 * Used by both login.html and register.html pages
 */

import { authAPI, storage, errorHandler, ui } from './api.js';

/**
 * Handles user login process
 * @param {Event} event - Form submission event
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const email = form.email.value.trim();
    const password = form.password.value;
    
    // Basic validation
    if (!email || !password) {
        errorHandler.showError('Please fill in all required fields');
        return;
    }
    
    // Email validation for Noroff domain
    if (!email.endsWith('@stud.noroff.no')) {
        errorHandler.showError('Please use a valid stud.noroff.no email address');
        return;
    }
    
    const loginButton = document.getElementById('loginButton');
    const loginButtonText = document.getElementById('loginButtonText');
    const loginSpinner = document.getElementById('loginSpinner');
    
    try {
        // Show loading state
        loginButton.disabled = true;
        loginButtonText.textContent = 'Signing in...';
        loginSpinner.classList.remove('hidden');
        errorHandler.hideError();
        
        // Attempt login
        const response = await authAPI.login({ email, password });
        
        if (response.data) {
            // Save user data
            storage.saveUser(response.data);
            
            // Create API key
            try {
                const apiKeyResponse = await authAPI.createApiKey();
                if (apiKeyResponse.data && apiKeyResponse.data.key) {
                    storage.saveApiKey(apiKeyResponse.data.key);
                }
            } catch (apiKeyError) {
                console.warn('Failed to create API key:', apiKeyError);
                // Continue without API key - some features may be limited
            }
            
            // Show success message
            errorHandler.showSuccess('Login successful! Redirecting...');
            
            // Redirect to home page after a short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }
    } catch (error) {
        console.error('Login error:', error);
        errorHandler.showError(error.message || 'Login failed. Please check your credentials.');
    } finally {
        // Reset button state
        loginButton.disabled = false;
        loginButtonText.textContent = 'Sign in';
        loginSpinner.classList.add('hidden');
    }
}

/**
 * Handles user registration process
 * @param {Event} event - Form submission event
 */
async function handleRegistration(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Extract form data
    const userData = {
        name: formData.get('name').trim(),
        email: formData.get('email').trim(),
        password: formData.get('password'),
        bio: formData.get('bio').trim(),
        avatar: formData.get('avatar').trim(),
        avatarAlt: formData.get('avatarAlt').trim()
    };
    
    // Validation
    if (!userData.name || !userData.email || !userData.password) {
        errorHandler.showError('Please fill in all required fields');
        return;
    }
    
    // Username validation (only letters, numbers, underscores)
    if (!/^[a-zA-Z0-9_]+$/.test(userData.name)) {
        errorHandler.showError('Username can only contain letters, numbers, and underscores');
        return;
    }
    
    // Email validation
    if (!userData.email.endsWith('@stud.noroff.no')) {
        errorHandler.showError('Please use a valid stud.noroff.no email address');
        return;
    }
    
    // Password validation
    if (userData.password.length < 8) {
        errorHandler.showError('Password must be at least 8 characters long');
        return;
    }
    
    // Bio length validation
    if (userData.bio && userData.bio.length > 160) {
        errorHandler.showError('Bio must be less than 160 characters');
        return;
    }
    
    // Avatar alt text validation
    if (userData.avatarAlt && userData.avatarAlt.length > 120) {
        errorHandler.showError('Avatar alt text must be less than 120 characters');
        return;
    }
    
    // Avatar URL validation
    if (userData.avatar && !isValidUrl(userData.avatar)) {
        errorHandler.showError('Please enter a valid avatar URL');
        return;
    }
    
    const registerButton = document.getElementById('registerButton');
    const registerButtonText = document.getElementById('registerButtonText');
    const registerSpinner = document.getElementById('registerSpinner');
    
    try {
        // Show loading state
        registerButton.disabled = true;
        registerButtonText.textContent = 'Creating Account...';
        registerSpinner.classList.remove('hidden');
        errorHandler.hideError();
        
        // Attempt registration
        const response = await authAPI.register(userData);
        
        if (response.data) {
            // Show success message
            errorHandler.showSuccess('Account created successfully! You can now log in.');
            
            // Clear form
            form.reset();
            
            // Redirect to login page after a short delay
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    } catch (error) {
        console.error('Registration error:', error);
        errorHandler.showError(error.message || 'Registration failed. Please try again.');
    } finally {
        // Reset button state
        registerButton.disabled = false;
        registerButtonText.textContent = 'Create Account';
        registerSpinner.classList.add('hidden');
    }
}

/**
 * Validates if a string is a valid URL
 * @param {string} string - The string to validate
 * @returns {boolean} True if valid URL
 */
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Toggles password visibility
 * @param {Event} event - Click event
 */
function togglePasswordVisibility(event) {
    event.preventDefault();
    
    const passwordInput = document.getElementById('password');
    const toggleIcon = event.target.closest('button').querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

/**
 * Handles logout functionality
 */
function handleLogout() {
    storage.clearUser();
    storage.clearFavorites();
    
    // Show success message if on a page with success message container
    const successContainer = document.getElementById('successMessage');
    if (successContainer) {
        errorHandler.showSuccess('Logged out successfully!');
    }
    
    // Redirect to home page after a short delay
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

/**
 * Updates character count for textarea elements
 * @param {Event} event - Input event
 */
function updateCharacterCount(event) {
    const textarea = event.target;
    const maxLength = textarea.getAttribute('maxlength');
    const currentLength = textarea.value.length;
    
    // Find or create character count display
    let countDisplay = textarea.parentNode.querySelector('.char-count');
    if (!countDisplay) {
        countDisplay = document.createElement('p');
        countDisplay.className = 'char-count mt-1 text-xs text-gray-500';
        textarea.parentNode.appendChild(countDisplay);
    }
    
    countDisplay.textContent = `${currentLength}/${maxLength} characters`;
    
    // Change color if approaching limit
    if (currentLength > maxLength * 0.9) {
        countDisplay.classList.remove('text-gray-500');
        countDisplay.classList.add('text-yellow-400');
    } else {
        countDisplay.classList.remove('text-yellow-400');
        countDisplay.classList.add('text-gray-500');
    }
}

/**
 * Initialize the authentication module
 */
function initAuth() {
    // Check if user is already logged in and redirect if on auth pages
    const currentPage = window.location.pathname;
    const isAuthPage = currentPage.includes('login.html') || currentPage.includes('register.html');
    
    if (storage.isLoggedIn() && isAuthPage) {
        window.location.href = 'index.html';
        return;
    }
    
    // Update auth UI on all pages
    ui.updateAuthUI();
    
    // Setup login form if on login page
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Setup registration form if on register page
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }
    
    // Setup password toggle
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        togglePassword.addEventListener('click', togglePasswordVisibility);
    }
    
    // Setup logout button
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
    
    // Setup character count for bio textarea
    const bioTextarea = document.getElementById('bio');
    if (bioTextarea) {
        bioTextarea.addEventListener('input', updateCharacterCount);
        // Trigger initial count
        updateCharacterCount({ target: bioTextarea });
    }
    
    // Setup character count for avatar alt text
    const avatarAltInput = document.getElementById('avatarAlt');
    if (avatarAltInput) {
        avatarAltInput.addEventListener('input', updateCharacterCount);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAuth); 