/**
 * Genre module for displaying games filtered by specific genres
 * Handles genre-specific game display, search, and sorting
 */

import { gamesAPI, storage, errorHandler, ui } from './api.js';

// Global state
let allGames = [];
let filteredGames = [];
let currentGenre = '';
let searchQuery = '';
let sortBy = 'name';
let allGenres = [];
let searchTimeout = null; // For debouncing search

/**
 * Gets genre from URL parameters
 * @returns {string|null} Genre name or null if not found
 */
function getGenreFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('genre');
}

/**
 * Loads and displays games for the specific genre
 */
async function loadGenreGames() {
    try {
        ui.showLoading();
        errorHandler.hideError();
        
        currentGenre = getGenreFromUrl();
        
        if (!currentGenre) {
            errorHandler.showError('No genre specified. Redirecting to homepage...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }
        
        const response = await gamesAPI.getAllGames();
        
        if (response.data) {
            allGames = response.data;
            
            // Extract all unique genres
            extractAllGenres();
            
            // Filter games by genre
            filterGamesByGenre();
            
            // Update page with genre info
            updateGenreInfo();
            
            // Display games
            displayGames();
            
            // Setup other genres
            setupOtherGenres();
        }
    } catch (error) {
        console.error('Error loading genre games:', error);
        errorHandler.showError('Failed to load games. Please try again later.');
    } finally {
        ui.hideLoading();
    }
}

/**
 * Extracts all unique genres from games
 */
function extractAllGenres() {
    const genreSet = new Set();
    
    allGames.forEach(game => {
        if (game.genre && Array.isArray(game.genre)) {
            game.genre.forEach(genre => genreSet.add(genre));
        }
    });
    
    allGenres = Array.from(genreSet).sort();
}

/**
 * Filters games by the current genre
 */
function filterGamesByGenre() {
    filteredGames = allGames.filter(game => {
        // Genre filter
        const hasGenre = game.genre && game.genre.includes(currentGenre);
        
        // Search filter
        const matchesSearch = !searchQuery || 
            game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            game.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            game.genre.some(genre => genre.toLowerCase().includes(searchQuery.toLowerCase()));
        
        return hasGenre && matchesSearch;
    });
    
    sortGames();
}

/**
 * Sorts games based on current sort criteria
 */
function sortGames() {
    filteredGames.sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'released':
                return parseInt(a.released) - parseInt(b.released);
            default:
                return 0;
        }
    });
}

/**
 * Updates page information with current genre
 */
function updateGenreInfo() {
    // Update page title
    document.title = `${currentGenre} Games - Old Games Platform`;
    
    // Update genre name display
    const genreName = document.getElementById('genreName');
    if (genreName) {
        genreName.textContent = currentGenre;
    }
    
    // Update games count
    updateGameCount();
}

/**
 * Updates the game count display
 */
function updateGameCount() {
    const countText = document.getElementById('countText');
    if (countText) {
        const count = filteredGames.length;
        if (count === 0) {
            countText.textContent = 'No games found';
        } else if (count === 1) {
            countText.textContent = '1 game found';
        } else {
            countText.textContent = `${count} games found`;
        }
    }
}

/**
 * Creates a game card element
 * @param {Object} game - Game data
 * @returns {HTMLElement} Game card element
 */
function createGameCard(game) {
    const isFavorited = storage.isFavorite(game.id);
    
    const card = document.createElement('div');
    card.className = 'bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:transform hover:scale-105 transition-all duration-300 cursor-pointer group';
    
    card.innerHTML = `
        <div class="relative">
            <img src="${game.image.url}" alt="${game.image.alt}" 
                 class="w-full h-48 object-cover group-hover:brightness-110 transition-all duration-300"
                 onerror="this.src='https://via.placeholder.com/400x300?text=Game+Image'">
            <div class="absolute top-2 right-2">
                <button class="favorite-btn p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-75 transition-all duration-200 ${isFavorited ? 'text-red-500' : 'text-gray-300'}" 
                        data-game-id="${game.id}" 
                        title="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
        </div>
        
        <div class="p-4">
            <h3 class="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors duration-200">
                ${game.name}
            </h3>
            
            <p class="text-gray-400 mb-3">
                <i class="fas fa-calendar mr-1"></i>
                Released: ${game.released}
            </p>
            
            <div class="flex flex-wrap gap-1 mb-3">
                ${game.genre.map(genre => `
                    <span class="px-2 py-1 ${genre === currentGenre ? 'bg-yellow-600' : 'bg-blue-600'} text-white text-xs rounded-full cursor-pointer hover:${genre === currentGenre ? 'bg-yellow-700' : 'bg-blue-700'} transition-colors duration-200" 
                          onclick="navigateToGenre('${genre}')">
                        ${genre}
                    </span>
                `).join('')}
            </div>
            
            <p class="text-gray-300 text-sm line-clamp-3 mb-4">
                ${truncateText(game.description, 120)}
            </p>
            
            <div class="flex justify-between items-center">
                <button class="view-details-btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors duration-200" 
                        data-game-id="${game.id}">
                    <i class="fas fa-eye mr-1"></i>
                    View Details
                </button>
                
                <span class="text-gray-500 text-xs">
                    ID: ${game.id}
                </span>
            </div>
        </div>
    `;
    
    return card;
}

/**
 * Truncates text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

/**
 * Displays games in the grid container
 */
function displayGames() {
    const container = document.getElementById('gamesContainer');
    const noResults = document.getElementById('noResults');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    if (filteredGames.length === 0) {
        container.classList.add('hidden');
        noResults.classList.remove('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    noResults.classList.add('hidden');
    
    filteredGames.forEach(game => {
        const gameCard = createGameCard(game);
        container.appendChild(gameCard);
    });
    
    // Update game count
    updateGameCount();
    
    // Add event listeners for game cards
    setupGameCardListeners();
}

/**
 * Sets up event listeners for game cards
 */
function setupGameCardListeners() {
    // View details buttons
    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const gameId = button.getAttribute('data-game-id');
            window.location.href = `game-details.html?id=${gameId}`;
        });
    });
    
    // Favorite buttons
    document.querySelectorAll('.favorite-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(button);
        });
    });
    
    // Game card click (navigate to details)
    document.querySelectorAll('#gamesContainer > div').forEach(card => {
        card.addEventListener('click', () => {
            const gameId = card.querySelector('.view-details-btn').getAttribute('data-game-id');
            window.location.href = `game-details.html?id=${gameId}`;
        });
    });
}

/**
 * Toggles favorite status for a game
 * @param {HTMLElement} button - Favorite button element
 */
function toggleFavorite(button) {
    const gameId = parseInt(button.getAttribute('data-game-id'));
    const isFavorited = storage.isFavorite(gameId);
    
    if (isFavorited) {
        storage.removeFromFavorites(gameId);
        button.classList.remove('text-red-500');
        button.classList.add('text-gray-300');
        button.setAttribute('title', 'Add to favorites');
    } else {
        storage.addToFavorites(gameId);
        button.classList.remove('text-gray-300');
        button.classList.add('text-red-500');
        button.setAttribute('title', 'Remove from favorites');
    }
}

/**
 * Sets up other genres display
 */
function setupOtherGenres() {
    const otherGenresContainer = document.getElementById('otherGenres');
    if (!otherGenresContainer) return;
    
    otherGenresContainer.innerHTML = '';
    
    // Filter out current genre and show others
    const otherGenres = allGenres.filter(genre => genre !== currentGenre);
    
    otherGenres.forEach(genre => {
        const genreButton = document.createElement('button');
        genreButton.className = 'px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white text-sm rounded-md transition-colors duration-200';
        genreButton.textContent = genre;
        genreButton.addEventListener('click', () => {
            navigateToGenre(genre);
        });
        otherGenresContainer.appendChild(genreButton);
    });
    
    // Add "All Genres" button
    const allGenresButton = document.createElement('button');
    allGenresButton.className = 'px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors duration-200';
    allGenresButton.innerHTML = '<i class="fas fa-th-large mr-1"></i>All Games';
    allGenresButton.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    otherGenresContainer.appendChild(allGenresButton);
}

/**
 * Navigates to another genre page
 * @param {string} genre - Genre name
 */
function navigateToGenre(genre) {
    window.location.href = `genre.html?genre=${encodeURIComponent(genre)}`;
}

/**
 * Handles search input with debouncing
 * @param {Event} event - Input event
 */
function handleSearch(event) {
    const query = event.target.value.trim();
    
    // Clear existing timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // Show search loading if there's a query
    if (query) {
        ui.showSearchLoading('searchInput');
    }
    
    // Set new timeout for debounced search
    searchTimeout = setTimeout(() => {
        searchQuery = query;
        filterGamesByGenre();
        
        // Hide search loading
        ui.hideSearchLoading('searchInput');
    }, 300); // 300ms delay
}

/**
 * Performs immediate search without debouncing (for programmatic calls)
 * @param {string} query - Search query
 */
function performSearch(query = '') {
    searchQuery = query;
    filterGamesByGenre();
}

/**
 * Handles sort selection change
 * @param {Event} event - Change event
 */
function handleSortChange(event) {
    sortBy = event.target.value;
    sortGames();
    displayGames();
}

/**
 * Sets up logout functionality
 */
function setupLogout() {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            storage.clearUser();
            ui.updateAuthUI();
            window.location.href = 'index.html';
        });
    }
}

/**
 * Initialize the genre module
 */
function initGenre() {
    // Update auth UI
    ui.updateAuthUI();
    
    // Load genre games
    loadGenreGames();
    
    // Setup search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Setup sort
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSortChange);
    }
    
    // Setup logout
    setupLogout();
}

// Make navigateToGenre globally accessible for inline onclick handlers
window.navigateToGenre = navigateToGenre;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initGenre); 