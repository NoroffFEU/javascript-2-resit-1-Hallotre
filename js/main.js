/**
 * Main module for the homepage functionality
 * Handles games display, search, filtering, sorting, and favorites
 */

import { gamesAPI, storage, errorHandler, ui } from './api.js';

// Global state
let allGames = [];
let filteredGames = [];
let currentGenres = [];
let searchQuery = '';
let sortBy = 'name';
let searchTimeout = null; // For debouncing search

/**
 * Loads and displays all games from the API
 */
async function loadGames() {
    try {
        ui.showLoading();
        errorHandler.hideError();
        
        const response = await gamesAPI.getAllGames();
        
        if (response.data) {
            allGames = response.data;
            filteredGames = [...allGames];
            
            // Extract unique genres
            extractGenres();
            
            // Apply current sorting
            sortGames();
            
            // Display games
            displayGames();
            
            // Setup genre dropdown
            setupGenreDropdown();
        }
    } catch (error) {
        console.error('Error loading games:', error);
        errorHandler.showError('Failed to load games. Please try again later.');
    } finally {
        ui.hideLoading();
    }
}

/**
 * Extracts unique genres from all games
 */
function extractGenres() {
    const genreSet = new Set();
    
    allGames.forEach(game => {
        if (game.genre && Array.isArray(game.genre)) {
            game.genre.forEach(genre => genreSet.add(genre));
        }
    });
    
    currentGenres = Array.from(genreSet).sort();
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
                    <span class="px-2 py-1 bg-blue-600 text-white text-xs rounded-full cursor-pointer hover:bg-blue-700 transition-colors duration-200" 
                          onclick="filterByGenre('${genre}')">
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
 * Filters games based on search query and other criteria
 */
function filterGames() {
    filteredGames = allGames.filter(game => {
        // Search filter
        const matchesSearch = !searchQuery || 
            game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            game.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            game.genre.some(genre => genre.toLowerCase().includes(searchQuery.toLowerCase()));
        
        return matchesSearch;
    });
    
    sortGames();
    displayGames();
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
 * Sets up the genre dropdown menu
 */
function setupGenreDropdown() {
    const genreList = document.getElementById('genreList');
    const genreDropdown = document.getElementById('genreDropdown');
    const genreMenu = document.getElementById('genreMenu');
    
    if (!genreList || !genreDropdown || !genreMenu) return;
    
    // Clear existing genres
    genreList.innerHTML = '';
    
    // Add "All Genres" option
    const allGenresItem = document.createElement('a');
    allGenresItem.href = '#';
    allGenresItem.className = 'block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white';
    allGenresItem.textContent = 'All Genres';
    allGenresItem.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'index.html';
    });
    genreList.appendChild(allGenresItem);
    
    // Add separator
    const separator = document.createElement('div');
    separator.className = 'border-t border-gray-700 my-1';
    genreList.appendChild(separator);
    
    // Add genre options
    currentGenres.forEach(genre => {
        const genreItem = document.createElement('a');
        genreItem.href = '#';
        genreItem.className = 'block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white';
        genreItem.textContent = genre;
        genreItem.addEventListener('click', (e) => {
            e.preventDefault();
            filterByGenre(genre);
        });
        genreList.appendChild(genreItem);
    });
    
    // Toggle dropdown
    genreDropdown.addEventListener('click', (e) => {
        e.preventDefault();
        genreMenu.classList.toggle('hidden');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!genreDropdown.contains(e.target) && !genreMenu.contains(e.target)) {
            genreMenu.classList.add('hidden');
        }
    });
}

/**
 * Filters games by genre and navigates to genre page
 * @param {string} genre - Genre to filter by
 */
function filterByGenre(genre) {
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
        filterGames();
        
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
    filterGames();
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
            window.location.reload();
        });
    }
}

/**
 * Initialize the main module
 */
function initMain() {
    // Update auth UI
    ui.updateAuthUI();
    
    // Load games
    loadGames();
    
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

// Make filterByGenre globally accessible for inline onclick handlers
window.filterByGenre = filterByGenre;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initMain); 