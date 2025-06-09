/**
 * API module for handling all HTTP requests to the Noroff API
 * Provides centralized error handling and authentication management
 */

// API Configuration
const API_BASE_URL = 'https://v2.api.noroff.dev';

/**
 * Makes authenticated API requests with proper error handling
 * @param {string} endpoint - The API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} The response data
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Get stored credentials
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const accessToken = user.accessToken;
    const apiKey = localStorage.getItem('apiKey');
    
    // Default headers
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    // Add authentication headers if available
    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    if (apiKey) {
        headers['X-Noroff-API-Key'] = apiKey;
    }
    
    const config = {
        ...options,
        headers
    };
    
    try {
        const response = await fetch(url, config);
        
        // Handle different response types
        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            
            try {
                const errorData = await response.json();
                if (errorData.errors && errorData.errors.length > 0) {
                    errorMessage = errorData.errors.map(err => err.message).join(', ');
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch (e) {
                // Fallback to status text if JSON parsing fails
            }
            
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

/**
 * Authentication API methods
 */
export const authAPI = {
    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} Registration response
     */
    async register(userData) {
        const requestData = {
            name: userData.name,
            email: userData.email,
            password: userData.password
        };
        
        // Add optional fields if provided
        if (userData.bio) {
            requestData.bio = userData.bio;
        }
        
        if (userData.avatar) {
            requestData.avatar = {
                url: userData.avatar,
                alt: userData.avatarAlt || ''
            };
        }
        
        return await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(requestData)
        });
    },
    
    /**
     * Login user
     * @param {Object} credentials - Login credentials
     * @returns {Promise<Object>} Login response
     */
    async login(credentials) {
        return await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    },
    
    /**
     * Create API key for authenticated user
     * @param {string} name - Name for the API key
     * @returns {Promise<Object>} API key response
     */
    async createApiKey(name = 'Old Games Platform Key') {
        return await apiRequest('/auth/create-api-key', {
            method: 'POST',
            body: JSON.stringify({ name })
        });
    }
};

/**
 * Games API methods
 */
export const gamesAPI = {
    /**
     * Get all games
     * @returns {Promise<Object>} Games response
     */
    async getAllGames() {
        return await apiRequest('/old-games');
    },
    
    /**
     * Get a single game by ID
     * @param {number} id - Game ID
     * @returns {Promise<Object>} Game response
     */
    async getGameById(id) {
        return await apiRequest(`/old-games/${id}`);
    },
    
    /**
     * Get a random game
     * @returns {Promise<Object>} Random game response
     */
    async getRandomGame() {
        return await apiRequest('/old-games/random');
    }
};

/**
 * Storage utilities for managing local data
 */
export const storage = {
    /**
     * Save user data to localStorage
     * @param {Object} userData - User data to save
     */
    saveUser(userData) {
        localStorage.setItem('user', JSON.stringify(userData));
    },
    
    /**
     * Get user data from localStorage
     * @returns {Object|null} User data or null
     */
    getUser() {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    },
    
    /**
     * Clear user data from localStorage
     */
    clearUser() {
        localStorage.removeItem('user');
        localStorage.removeItem('apiKey');
    },
    
    /**
     * Save API key to localStorage
     * @param {string} apiKey - API key to save
     */
    saveApiKey(apiKey) {
        localStorage.setItem('apiKey', apiKey);
    },
    
    /**
     * Get API key from localStorage
     * @returns {string|null} API key or null
     */
    getApiKey() {
        return localStorage.getItem('apiKey');
    },
    
    /**
     * Check if user is logged in
     * @returns {boolean} True if user is logged in
     */
    isLoggedIn() {
        const user = this.getUser();
        return user && user.accessToken && this.getApiKey();
    },
    
    /**
     * Save favorite games to localStorage
     * @param {Array} favorites - Array of game IDs
     */
    saveFavorites(favorites) {
        localStorage.setItem('favorites', JSON.stringify(favorites));
    },
    
    /**
     * Get favorite games from localStorage
     * @returns {Array} Array of game IDs
     */
    getFavorites() {
        const favorites = localStorage.getItem('favorites');
        return favorites ? JSON.parse(favorites) : [];
    },
    
    /**
     * Add game to favorites
     * @param {number} gameId - Game ID to add
     */
    addToFavorites(gameId) {
        const favorites = this.getFavorites();
        if (!favorites.includes(gameId)) {
            favorites.push(gameId);
            this.saveFavorites(favorites);
        }
    },
    
    /**
     * Remove game from favorites
     * @param {number} gameId - Game ID to remove
     */
    removeFromFavorites(gameId) {
        const favorites = this.getFavorites();
        const updatedFavorites = favorites.filter(id => id !== gameId);
        this.saveFavorites(updatedFavorites);
    },
    
    /**
     * Check if game is in favorites
     * @param {number} gameId - Game ID to check
     * @returns {boolean} True if game is favorited
     */
    isFavorite(gameId) {
        const favorites = this.getFavorites();
        return favorites.includes(gameId);
    },
    
    /**
     * Clear all favorites
     */
    clearFavorites() {
        localStorage.removeItem('favorites');
    },

    /**
     * Removes a game from favorites (alternative method name)
     * @param {number} gameId - Game ID to remove
     */
    removeFavorite(gameId) {
        this.removeFromFavorites(gameId);
    },

    /**
     * Get token from user data
     * @returns {string|null} Access token or null
     */
    getToken() {
        const user = this.getUser();
        return user ? user.accessToken : null;
    }
};

/**
 * Error handling utilities
 */
export const errorHandler = {
    /**
     * Display error message to user
     * @param {string} message - Error message
     * @param {string} containerId - ID of error container element
     */
    showError(message, containerId = 'errorMessage') {
        const errorContainer = document.getElementById(containerId);
        const errorText = document.getElementById('errorText');
        
        if (errorContainer && errorText) {
            errorText.textContent = message;
            errorContainer.classList.remove('hidden');
            
            // Auto-hide error after 10 seconds
            setTimeout(() => {
                errorContainer.classList.add('hidden');
            }, 10000);
        }
    },
    
    /**
     * Hide error message
     * @param {string} containerId - ID of error container element
     */
    hideError(containerId = 'errorMessage') {
        const errorContainer = document.getElementById(containerId);
        if (errorContainer) {
            errorContainer.classList.add('hidden');
        }
    },
    
    /**
     * Display success message to user
     * @param {string} message - Success message
     * @param {string} containerId - ID of success container element
     */
    showSuccess(message, containerId = 'successMessage') {
        const successContainer = document.getElementById(containerId);
        const successText = document.getElementById('successText');
        
        if (successContainer && successText) {
            successText.textContent = message;
            successContainer.classList.remove('hidden');
            
            // Auto-hide success after 5 seconds
            setTimeout(() => {
                successContainer.classList.add('hidden');
            }, 5000);
        }
    },

    /**
     * Shows a success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        this.showMessage(message, 'success');
    },

    /**
     * Shows a temporary message
     * @param {string} message - Message text
     * @param {string} type - Message type ('success', 'error', 'info')
     */
    showMessage(message, type = 'info') {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `fixed top-4 right-4 px-4 py-3 rounded-md shadow-lg z-50 transition-all duration-300 transform translate-x-full`;
        
        // Set message styles based on type
        switch (type) {
            case 'success':
                messageEl.className += ' bg-green-900 border border-green-700 text-green-100';
                break;
            case 'error':
                messageEl.className += ' bg-red-900 border border-red-700 text-red-100';
                break;
            case 'info':
            default:
                messageEl.className += ' bg-blue-900 border border-blue-700 text-blue-100';
                break;
        }
        
        messageEl.innerHTML = `
            <div class="flex items-center">
                <span>${message}</span>
                <button class="ml-3 text-current hover:opacity-75" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(messageEl);
        
        // Animate in
        setTimeout(() => {
            messageEl.classList.remove('translate-x-full');
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentElement) {
                messageEl.classList.add('translate-x-full');
                setTimeout(() => {
                    if (messageEl.parentElement) {
                        messageEl.remove();
                    }
                }, 300);
            }
        }, 5000);
    },

    /**
     * Hides loading spinner
     */
    hideLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.classList.add('hidden');
        }
    }
};

/**
 * UI utilities for common operations
 */
export const ui = {
    /**
     * Show loading spinner
     * @param {string} spinnerId - ID of spinner element
     */
    showLoading(spinnerId = 'loadingSpinner') {
        const spinner = document.getElementById(spinnerId);
        if (spinner) {
            spinner.classList.remove('hidden');
        }
    },
    
    /**
     * Hide loading spinner
     * @param {string} spinnerId - ID of spinner element
     */
    hideLoading(spinnerId = 'loadingSpinner') {
        const spinner = document.getElementById(spinnerId);
        if (spinner) {
            spinner.classList.add('hidden');
        }
    },
    
    /**
     * Show search loading state in input field
     * @param {string} inputId - ID of input element
     */
    showSearchLoading(inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            const icon = input.parentElement.querySelector('.fas');
            if (icon) {
                icon.className = 'fas fa-spinner fa-spin text-gray-400';
            }
        }
    },
    
    /**
     * Hide search loading state in input field
     * @param {string} inputId - ID of input element
     */
    hideSearchLoading(inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            const icon = input.parentElement.querySelector('.fas');
            if (icon) {
                icon.className = 'fas fa-search text-gray-400';
            }
        }
    },

    /**
     * Shows a success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        this.showMessage(message, 'success');
    },

    /**
     * Shows a temporary message
     * @param {string} message - Message text
     * @param {string} type - Message type ('success', 'error', 'info')
     */
    showMessage(message, type = 'info') {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `fixed top-4 right-4 px-4 py-3 rounded-md shadow-lg z-50 transition-all duration-300 transform translate-x-full`;
        
        // Set message styles based on type
        switch (type) {
            case 'success':
                messageEl.className += ' bg-green-900 border border-green-700 text-green-100';
                break;
            case 'error':
                messageEl.className += ' bg-red-900 border border-red-700 text-red-100';
                break;
            case 'info':
            default:
                messageEl.className += ' bg-blue-900 border border-blue-700 text-blue-100';
                break;
        }
        
        messageEl.innerHTML = `
            <div class="flex items-center">
                <span>${message}</span>
                <button class="ml-3 text-current hover:opacity-75" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(messageEl);
        
        // Animate in
        setTimeout(() => {
            messageEl.classList.remove('translate-x-full');
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentElement) {
                messageEl.classList.add('translate-x-full');
                setTimeout(() => {
                    if (messageEl.parentElement) {
                        messageEl.remove();
                    }
                }, 300);
            }
        }, 5000);
    },
    
    /**
     * Update authentication UI based on login status
     */
    updateAuthUI() {
        const authButtons = document.getElementById('authButtons');
        const userMenu = document.getElementById('userMenu');
        const isLoggedIn = storage.isLoggedIn();
        
        if (authButtons && userMenu) {
            if (isLoggedIn) {
                authButtons.classList.add('hidden');
                userMenu.classList.remove('hidden');
                userMenu.classList.add('flex');
            } else {
                authButtons.classList.remove('hidden');
                userMenu.classList.add('hidden');
                userMenu.classList.remove('flex');
            }
        }
    }
}; 