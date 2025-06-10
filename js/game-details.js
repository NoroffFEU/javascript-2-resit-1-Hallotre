/**
 * Game details module for displaying individual game information
 * Handles game details display, favorites, and related games
 */

import { gamesAPI, storage, errorHandler, ui } from './api.js';

let currentGame = null;
let allGames = [];

/**
 * Gets game ID from URL parameters
 * @returns {string|null} Game ID or null if not found
 */
function getGameIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

/**
 * Loads and displays game details
 * @param {string} gameId - Game ID to load
 */
async function loadGameDetails(gameId) {
    try {
        ui.showLoading();
        errorHandler.hideError();
        
        const response = await gamesAPI.getGameById(gameId);
        
        if (response.data) {
            currentGame = response.data;
            displayGameDetails();
            
            // Load all games for related games section
            await loadAllGamesForRelated();
        }
    } catch (error) {
        console.error('Error loading game details:', error);
        errorHandler.showError('Failed to load game details. Please try again later.');
        
        // Hide game details container on error
        const gameDetails = document.getElementById('gameDetails');
        if (gameDetails) {
            gameDetails.classList.add('hidden');
        }
    } finally {
        ui.hideLoading();
    }
}

/**
 * Displays game details in the UI
 */
function displayGameDetails() {
    if (!currentGame) return;
    
    // Update page title
    document.title = `${currentGame.name} - Old Games Platform`;
    
    // Show game details container
    const gameDetails = document.getElementById('gameDetails');
    if (gameDetails) {
        gameDetails.classList.remove('hidden');
    }
    
    // Update game image
    const gameImage = document.getElementById('gameImage');
    if (gameImage) {
        gameImage.src = currentGame.image.url;
        gameImage.alt = currentGame.image.alt;
        gameImage.onerror = function() {
            this.style.display = 'none';
            const placeholder = this.nextElementSibling;
            if (placeholder) {
                placeholder.style.display = 'flex';
            }
        };
    }
    
    // Update game title
    const gameTitle = document.getElementById('gameTitle');
    if (gameTitle) {
        gameTitle.textContent = currentGame.name;
    }
    
    // Update game ID
    const gameId = document.getElementById('gameId');
    if (gameId) {
        gameId.textContent = currentGame.id;
    }
    
    // Update release date
    const gameReleased = document.getElementById('gameReleased');
    if (gameReleased) {
        gameReleased.textContent = `Released: ${currentGame.released}`;
    }
    
    // Update genres
    const gameGenres = document.getElementById('gameGenres');
    if (gameGenres && currentGame.genre) {
        gameGenres.innerHTML = currentGame.genre.map(genre => `
            <span class="win98-genre-tag" onclick="navigateToGenre('${genre}')">
                ${genre}
            </span>
        `).join('');
    }
    
    // Update description
    const gameDescription = document.getElementById('gameDescription');
    if (gameDescription) {
        gameDescription.textContent = currentGame.description;
    }
    
    // Update favorite button
    updateFavoriteButton();
}

/**
 * Updates the favorite button state
 */
function updateFavoriteButton() {
    const favoriteButton = document.getElementById('favoriteButton');
    const favoriteIcon = document.getElementById('favoriteIcon');
    
    if (!favoriteButton || !favoriteIcon || !currentGame) return;
    
    const isFavorited = storage.isFavorite(currentGame.id);
    
    if (isFavorited) {
        favoriteButton.className = 'win98-favorite-btn-large favorited';
        favoriteIcon.className = 'fas fa-heart';
        favoriteButton.title = 'Remove from Favorites';
    } else {
        favoriteButton.className = 'win98-favorite-btn-large';
        favoriteIcon.className = 'fas fa-heart';
        favoriteButton.title = 'Add to Favorites';
    }
}

/**
 * Toggles favorite status for current game
 */
function toggleFavorite() {
    if (!currentGame) return;
    
    const isFavorited = storage.isFavorite(currentGame.id);
    
    if (isFavorited) {
        storage.removeFromFavorites(currentGame.id);
    } else {
        storage.addToFavorites(currentGame.id);
    }
    
    updateFavoriteButton();
}

/**
 * Loads all games for related games section
 */
async function loadAllGamesForRelated() {
    try {
        const response = await gamesAPI.getAllGames();
        
        if (response.data) {
            allGames = response.data;
            displayRelatedGames();
        }
    } catch (error) {
        console.error('Error loading all games for related section:', error);
        // Don't show error for related games failure
    }
}

/**
 * Displays related games based on genre similarity
 */
function displayRelatedGames() {
    const relatedContainer = document.getElementById('relatedGames');
    if (!relatedContainer || !currentGame || !allGames.length) return;
    
    // Find games with similar genres, excluding current game
    const relatedGames = allGames
        .filter(game => game.id !== currentGame.id)
        .filter(game => {
            // Check if game shares at least one genre with current game
            return game.genre.some(genre => currentGame.genre.includes(genre));
        })
        .slice(0, 8); // Limit to 8 related games
    
    // If no related games by genre, show random games
    if (relatedGames.length === 0) {
        const randomGames = allGames
            .filter(game => game.id !== currentGame.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 8);
        relatedGames.push(...randomGames);
    }
    
    relatedContainer.innerHTML = '';
    
    relatedGames.forEach(game => {
        const gameCard = createRelatedGameCard(game);
        relatedContainer.appendChild(gameCard);
    });
}

/**
 * Creates a related game card element
 * @param {Object} game - Game data
 * @returns {HTMLElement} Game card element
 */
function createRelatedGameCard(game) {
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
            <button class="win98-favorite-btn related-favorite-btn ${isFavorited ? 'favorited' : ''}" 
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
                ${game.genre.slice(0, 2).map(genre => `
                    <span class="win98-genre-tag" onclick="navigateToGenre('${genre}')">
                        ${genre}
                    </span>
                `).join('')}
                ${game.genre.length > 2 ? `<span class="win98-game-id">+${game.genre.length - 2}</span>` : ''}
            </div>
            
            <div class="win98-game-actions">
                <button class="win98-view-details-btn related-view-btn" data-game-id="${game.id}">
                    <i class="fas fa-eye"></i>
                    <span>View Details</span>
                </button>
            </div>
        </div>
    `;
    
    return card;
}

/**
 * Navigates to a random game
 */
async function navigateToRandomGame() {
    try {
        const response = await gamesAPI.getRandomGame();
        
        if (response.data) {
            window.location.href = `game-details.html?id=${response.data.id}`;
        }
    } catch (error) {
        console.error('Error getting random game:', error);
        errorHandler.showError('Failed to load random game. Please try again.');
    }
}

/**
 * Navigates to genre page
 * @param {string} genre - Genre name
 */
function navigateToGenre(genre) {
    window.location.href = `genre.html?genre=${encodeURIComponent(genre)}`;
}

/**
 * Sets up event listeners for related game cards
 */
function setupRelatedGameListeners() {
    // Related game card clicks
    document.querySelectorAll('#relatedGames .win98-game-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't navigate if clicking on favorite button
            if (e.target.closest('.related-favorite-btn')) return;
            
            const gameId = card.querySelector('.related-view-btn').getAttribute('data-game-id');
            window.location.href = `game-details.html?id=${gameId}`;
        });
    });
    
    // Related game view buttons
    document.querySelectorAll('.related-view-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const gameId = button.getAttribute('data-game-id');
            window.location.href = `game-details.html?id=${gameId}`;
        });
    });
    
    // Related game favorite buttons
    document.querySelectorAll('.related-favorite-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleRelatedFavorite(button);
        });
    });
}

/**
 * Toggles favorite status for a related game
 * @param {HTMLElement} button - Favorite button element
 */
function toggleRelatedFavorite(button) {
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
 * Initialize the game details module
 */
function initGameDetails() {
    // Update auth UI
    ui.updateAuthUI();
    
    // Get game ID from URL
    const gameId = getGameIdFromUrl();
    
    if (!gameId) {
        errorHandler.showError('No game ID provided. Redirecting to homepage...');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    // Load game details
    loadGameDetails(gameId);
    
    // Setup favorite button
    const favoriteButton = document.getElementById('favoriteButton');
    if (favoriteButton) {
        favoriteButton.addEventListener('click', toggleFavorite);
    }
    
    // Setup random game button
    const randomGameButton = document.getElementById('randomGameButton');
    if (randomGameButton) {
        randomGameButton.addEventListener('click', navigateToRandomGame);
    }
    
    // Setup logout
    setupLogout();
    
    // Setup related games listeners (will be called after related games are loaded)
    const observer = new MutationObserver(() => {
        const relatedGames = document.getElementById('relatedGames');
        if (relatedGames && relatedGames.children.length > 0) {
            setupRelatedGameListeners();
            observer.disconnect();
        }
    });
    
    const relatedGamesContainer = document.getElementById('relatedGames');
    if (relatedGamesContainer) {
        observer.observe(relatedGamesContainer, { childList: true });
    }
}

// Make navigateToGenre globally accessible for inline onclick handlers
window.navigateToGenre = navigateToGenre;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initGameDetails); 