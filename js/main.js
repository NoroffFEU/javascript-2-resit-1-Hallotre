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
            
            // Update status bar
            updateStatusBar('Games loaded successfully');
        }
    } catch (error) {
        console.error('Error loading games:', error);
        errorHandler.showError('Failed to load games. Please try again later.');
        updateStatusBar('Error loading games');
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
    card.className = 'win98-game-card';
    
    card.innerHTML = `
        <div class="win98-game-image">
            <img src="${game.image.url}" alt="${game.image.alt}" 
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="win98-image-placeholder">
                <i class="fas fa-image"></i>
                <span>No Image</span>
            </div>
            <button class="win98-favorite-btn favorite-btn ${isFavorited ? 'favorited' : ''}" 
                    data-game-id="${game.id}" 
                    title="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}">
                <i class="fas fa-heart"></i>
            </button>
        </div>
        
        <div class="win98-game-info">
            <div class="win98-game-title">${game.name}</div>
            
            <div class="win98-game-meta">
                <i class="fas fa-calendar"></i>
                <span>Released: ${game.released}</span>
            </div>
            
            <div class="win98-game-genres">
                ${game.genre.map(genre => `
                    <span class="win98-genre-tag" onclick="filterByGenre('${genre}')">
                        ${genre}
                    </span>
                `).join('')}
            </div>
            
            <div class="win98-game-description">
                ${truncateText(game.description, 120)}
            </div>
            
            <div class="win98-game-actions">
                <button class="win98-view-details-btn view-details-btn" data-game-id="${game.id}">
                    <i class="fas fa-eye"></i>
                    <span>View Details</span>
                </button>
                
                <span class="win98-game-id">ID: ${game.id}</span>
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
        updateStatusBar('No games found');
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
    
    // Update status bar
    updateStatusBar(`Showing ${filteredGames.length} game${filteredGames.length !== 1 ? 's' : ''}`);
}

/**
 * Updates the Windows 98 style status bar
 * @param {string} message - Status message
 */
function updateStatusBar(message) {
    const statusText = document.getElementById('statusText');
    const gameCount = document.getElementById('gameCount');
    
    if (statusText) {
        statusText.textContent = message;
    }
    
    if (gameCount && allGames.length > 0) {
        gameCount.textContent = `Total: ${allGames.length} games`;
    }
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
        button.style.color = '';
        button.setAttribute('title', 'Add to favorites');
    } else {
        storage.addToFavorites(gameId);
        button.style.color = 'red';
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
    const allGenresItem = document.createElement('button');
    allGenresItem.className = 'win98-dropdown-item';
    allGenresItem.textContent = 'All Genres';
    allGenresItem.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'index.html';
    });
    genreList.appendChild(allGenresItem);
    
    // Add separator
    const separator = document.createElement('div');
    separator.style.borderTop = '1px solid var(--win98-button-shadow)';
    separator.style.margin = '2px 0';
    genreList.appendChild(separator);
    
    // Add genre options
    currentGenres.forEach(genre => {
        const genreItem = document.createElement('button');
        genreItem.className = 'win98-dropdown-item';
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