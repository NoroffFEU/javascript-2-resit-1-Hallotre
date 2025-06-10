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
    card.className = 'win98-game-card';
    
    card.innerHTML = `
        <div class="win98-game-image">
            <img src="${game.image.url}" alt="${game.image.alt}" 
                 style="max-width: 100%; max-height: 100%; object-fit: cover;"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div style="display: none; align-items: center; justify-content: center; width: 100%; height: 100%; background: var(--win98-field-bg); color: var(--win98-disabled-text); font-size: 10px;">
                <i class="fas fa-image" style="margin-right: 4px;"></i>No Image
            </div>
            <div style="position: absolute; top: 4px; right: 4px;">
                <button class="favorite-btn win98-button" style="min-height: 20px; padding: 2px 4px; font-size: 10px; ${isFavorited ? 'color: red;' : ''}" 
                        data-game-id="${game.id}" 
                        title="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
        </div>
        
        <div class="win98-game-info">
            <div class="win98-game-title">
                ${game.name}
            </div>
            
            <div class="win98-game-genre">
                <i class="fas fa-calendar" style="margin-right: 2px;"></i>
                Released: ${game.released}
            </div>
            
            <div style="display: flex; flex-wrap: wrap; gap: 2px; margin-bottom: 4px;">
                ${game.genre.map(genre => `
                    <span style="padding: 1px 4px; background: ${genre === currentGenre ? 'var(--win98-selected-bg)' : 'var(--win98-selected-bg)'}; color: var(--win98-selected-text); font-size: 9px; cursor: pointer; border: 1px outset var(--win98-bg); ${genre === currentGenre ? 'font-weight: bold;' : ''}" 
                          onclick="navigateToGenre('${genre}')">
                        ${genre}
                    </span>
                `).join('')}
            </div>
            
            <div style="font-size: 10px; color: var(--win98-text); margin-bottom: 8px; line-height: 1.3;">
                ${truncateText(game.description, 120)}
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <button class="view-details-btn win98-button" style="font-size: 10px;" 
                        data-game-id="${game.id}">
                    <i class="fas fa-eye" style="margin-right: 2px;"></i>
                    View Details
                </button>
                
                <span style="color: var(--win98-disabled-text); font-size: 9px;">
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
        button.style.color = '';
        button.setAttribute('title', 'Add to favorites');
    } else {
        storage.addToFavorites(gameId);
        button.style.color = 'red';
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
        genreButton.className = 'win98-button';
        genreButton.style.fontSize = '10px';
        genreButton.style.marginRight = '4px';
        genreButton.style.marginBottom = '4px';
        genreButton.textContent = genre;
        genreButton.addEventListener('click', () => {
            navigateToGenre(genre);
        });
        otherGenresContainer.appendChild(genreButton);
    });
    
    // Add "All Genres" button
    const allGenresButton = document.createElement('button');
    allGenresButton.className = 'win98-button';
    allGenresButton.style.fontSize = '10px';
    allGenresButton.style.marginRight = '4px';
    allGenresButton.style.marginBottom = '4px';
    allGenresButton.innerHTML = '<i class="fas fa-th-large" style="margin-right: 4px;"></i>All Games';
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