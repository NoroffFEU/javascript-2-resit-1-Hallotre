/**
 * Profile module for displaying user profile and managing favorites
 * Handles user profile display, favorite games, and profile actions
 */

import { gamesAPI, storage, errorHandler, ui } from './api.js';

let favoriteGames = [];
let allGames = [];
let currentUser = null;
let favoritesSearchTimeout = null; // For debouncing favorites search

/**
 * Loads and displays user profile information
 */
async function loadProfile() {
    try {
        ui.showLoading();
        errorHandler.hideError();
        
        // Check if user is logged in
        if (!storage.isLoggedIn()) {
            showNotLoggedIn();
            return;
        }
        
        const user = storage.getUser();
        
        if (user) {
            currentUser = user;
            displayUserProfile(user);
            await loadFavoriteGames();
            showProfileContent();
        } else {
            showNotLoggedIn();
        }
        
    } catch (error) {
        console.error('Error loading profile:', error);
        errorHandler.showError('Failed to load profile. Please try again later.');
    } finally {
        ui.hideLoading();
    }
}

/**
 * Displays user profile information
 * @param {Object} user - User data
 */
function displayUserProfile(user) {
    // Update avatar
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar) {
        userAvatar.src = user.avatar?.url || 'https://via.placeholder.com/128x128?text=User';
        userAvatar.alt = user.avatar?.alt || `${user.name} avatar`;
        userAvatar.onerror = function() {
            this.src = 'https://via.placeholder.com/128x128?text=User';
        };
    }
    
    // Update user name
    const userName = document.getElementById('userName');
    if (userName) {
        userName.textContent = user.name;
    }
    
    // Update user email
    const userEmail = document.getElementById('userEmail');
    if (userEmail) {
        userEmail.textContent = user.email;
    }
    
    // Update profile username
    const profileUsername = document.getElementById('profileUsername');
    if (profileUsername) {
        profileUsername.textContent = user.name;
    }
    
    // Update profile email
    const profileEmail = document.getElementById('profileEmail');
    if (profileEmail) {
        profileEmail.textContent = user.email;
    }
    
    // Update bio
    const profileBio = document.getElementById('profileBio');
    if (profileBio) {
        profileBio.textContent = user.bio || 'No bio provided.';
    }
    
    // Update avatar URL display
    const profileAvatarUrl = document.getElementById('profileAvatarUrl');
    if (profileAvatarUrl) {
        profileAvatarUrl.textContent = user.avatar?.url || 'No avatar URL';
    }
    
    // Update member since (creation date simulation)
    const memberSince = document.getElementById('memberSince');
    if (memberSince) {
        // Since we don't have creation date from API, use a generic date
        memberSince.textContent = 'Recently joined';
    }
}

/**
 * Toggles profile edit mode
 */
function toggleEditMode() {
    const viewMode = document.getElementById('profileViewMode');
    const editMode = document.getElementById('profileEditMode');
    const editButton = document.getElementById('editProfileButton');
    
    if (viewMode && editMode && editButton) {
        const isEditing = !editMode.classList.contains('hidden');
        
        if (isEditing) {
            // Switch to view mode
            editMode.classList.add('hidden');
            viewMode.classList.remove('hidden');
            editButton.innerHTML = '<i class="fas fa-edit mr-1"></i>Edit Profile';
        } else {
            // Switch to edit mode and populate fields
            viewMode.classList.add('hidden');
            editMode.classList.remove('hidden');
            editButton.innerHTML = '<i class="fas fa-eye mr-1"></i>View Profile';
            
            // Populate edit fields with current data
            if (currentUser) {
                const editBio = document.getElementById('editBio');
                const editAvatar = document.getElementById('editAvatar');
                const editAvatarAlt = document.getElementById('editAvatarAlt');
                
                if (editBio) editBio.value = currentUser.bio || '';
                if (editAvatar) editAvatar.value = currentUser.avatar?.url || '';
                if (editAvatarAlt) editAvatarAlt.value = currentUser.avatar?.alt || '';
            }
        }
    }
}

/**
 * Handles profile update form submission
 * @param {Event} event - Form submission event
 */
async function handleProfileUpdate(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const updateData = {
        bio: formData.get('bio').trim(),
        avatar: {
            url: formData.get('avatar').trim(),
            alt: formData.get('avatarAlt').trim()
        }
    };
    
    // Remove empty avatar object if no URL provided
    if (!updateData.avatar.url) {
        delete updateData.avatar;
    }
    
    try {
        const saveButton = document.getElementById('saveProfileButton');
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Saving...';
        }
        
        // Here you would normally make an API call to update the profile
        // Since the API might not support user profile updates, we'll simulate it
        
        // Update local storage and current user object
        const updatedUser = { ...currentUser, ...updateData };
        currentUser = updatedUser;
        storage.saveUser(updatedUser);
        
        // Update the display
        displayUserProfile(updatedUser);
        
        // Switch back to view mode
        toggleEditMode();
        
        // Show success message
        errorHandler.showSuccess('Profile updated successfully!');
        
    } catch (error) {
        console.error('Error updating profile:', error);
        errorHandler.showError('Failed to update profile. Please try again.');
    } finally {
        const saveButton = document.getElementById('saveProfileButton');
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.innerHTML = '<i class="fas fa-save mr-1"></i>Save Changes';
        }
    }
}

/**
 * Shows the favorites search container when there are favorites
 */
function showFavoritesSearch() {
    const searchContainer = document.getElementById('favoritesSearchContainer');
    if (searchContainer) {
        searchContainer.classList.remove('hidden');
    }
}

/**
 * Hides the favorites search container when there are no favorites
 */
function hideFavoritesSearch() {
    const searchContainer = document.getElementById('favoritesSearchContainer');
    if (searchContainer) {
        searchContainer.classList.add('hidden');
    }
}

/**
 * Loads and displays favorite games
 */
async function loadFavoriteGames() {
    try {
        const favoriteIds = storage.getFavorites();
        
        if (favoriteIds.length === 0) {
            showNoFavorites();
            updateFavoriteCount(0);
            hideFavoritesSearch();
            return;
        }
        
        // Load all games to find favorites
        const response = await gamesAPI.getAllGames();
        
        if (response.data) {
            allGames = response.data;
            
            // Filter favorite games
            favoriteGames = allGames.filter(game => favoriteIds.includes(game.id));
            
            displayFavoriteGames();
            updateFavoriteCount(favoriteGames.length);
            
            if (favoriteGames.length > 0) {
                showFavoritesHeader();
                showFavoritesSearch();
            } else {
                hideFavoritesSearch();
            }
        }
        
    } catch (error) {
        console.error('Error loading favorite games:', error);
        // Don't show error for favorite games loading failure
        showNoFavorites();
        hideFavoritesSearch();
    }
}

/**
 * Shows the no favorites message
 */
function showNoFavorites() {
    const container = document.getElementById('favoriteGamesContainer');
    const noFavorites = document.getElementById('noFavorites');
    const favoritesHeader = document.getElementById('favoritesHeader');
    
    if (container) {
        container.classList.add('hidden');
    }
    
    if (noFavorites) {
        noFavorites.classList.remove('hidden');
    }
    
    if (favoritesHeader) {
        favoritesHeader.classList.add('hidden');
    }
    
    hideFavoritesSearch();
}

/**
 * Displays favorite games in the grid
 */
function displayFavoriteGames() {
    const container = document.getElementById('favoriteGamesContainer');
    const noFavorites = document.getElementById('noFavorites');
    
    if (!container) return;
    
    if (favoriteGames.length === 0) {
        showNoFavorites();
        return;
    }
    
    // Hide no favorites message and show container
    if (noFavorites) {
        noFavorites.classList.add('hidden');
    }
    container.classList.remove('hidden');
    
    // Clear container
    container.innerHTML = '';
    
    // Create game cards
    favoriteGames.forEach(game => {
        const gameCard = createGameCard(game);
        container.appendChild(gameCard);
    });
}

/**
 * Creates a game card element
 * @param {Object} game - Game data
 * @returns {HTMLElement} Game card element
 */
function createGameCard(game) {
    const card = document.createElement('div');
    card.className = 'bg-gray-700 rounded-lg shadow-lg overflow-hidden hover:transform hover:scale-105 transition-all duration-300';
    
    const imageUrl = game.image?.url || 'https://via.placeholder.com/300x200?text=Game';
    const imageAlt = game.image?.alt || game.name;
    
    card.innerHTML = `
        <div class="relative">
            <img src="${imageUrl}" alt="${imageAlt}" 
                 class="w-full h-48 object-cover"
                 onerror="this.src='https://via.placeholder.com/300x200?text=Game'">
            
            <!-- Favorite button overlay -->
            <button class="absolute top-2 right-2 w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors duration-200"
                    onclick="removeFavorite(${game.id})"
                    title="Remove from favorites">
                <i class="fas fa-heart text-sm"></i>
            </button>
        </div>
        <div class="p-4">
            <h3 class="text-lg font-semibold text-white mb-2 line-clamp-1">${game.name}</h3>
            <div class="flex items-center justify-between mb-3">
                <span class="text-gray-400 text-sm">
                    <i class="fas fa-calendar mr-1"></i>
                    ${game.released}
                </span>
                <div class="flex flex-wrap gap-1">
                    ${game.genre.slice(0, 2).map(genre => 
                        `<span class="px-2 py-1 bg-blue-600 text-white text-xs rounded">${genre}</span>`
                    ).join('')}
                </div>
            </div>
            <p class="text-gray-300 text-sm mb-4 line-clamp-3">${game.description}</p>
            <a href="game-details.html?id=${game.id}" 
               class="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded transition-colors duration-200">
                View Details
            </a>
        </div>
    `;
    
    return card;
}

/**
 * Updates the favorite count display
 * @param {number} count - Number of favorites
 */
function updateFavoriteCount(count) {
    const favoriteCount = document.getElementById('favoriteCount');
    const favoritesCount = document.getElementById('favoritesCount');
    
    if (favoriteCount) {
        favoriteCount.textContent = count;
    }
    
    if (favoritesCount) {
        favoritesCount.textContent = count;
    }
}

/**
 * Handles favorite games search with debouncing
 */
function handleFavoritesSearch() {
    const searchInput = document.getElementById('favoritesSearch');
    if (!searchInput) return;
    
    const query = searchInput.value.toLowerCase().trim();
    
    // Clear existing timeout
    if (favoritesSearchTimeout) {
        clearTimeout(favoritesSearchTimeout);
    }
    
    // Show search loading if there's a query
    if (query) {
        ui.showSearchLoading('favoritesSearch');
    }
    
    // Set new timeout for debounced search
    favoritesSearchTimeout = setTimeout(() => {
        performFavoritesSearch(query);
        
        // Hide search loading
        ui.hideSearchLoading('favoritesSearch');
    }, 300); // 300ms delay
}

/**
 * Performs immediate favorites search without debouncing
 * @param {string} query - Search query
 */
function performFavoritesSearch(query) {
    if (!query) {
        displayFavoriteGames();
        return;
    }
    
    const filteredGames = favoriteGames.filter(game => 
        game.name.toLowerCase().includes(query) ||
        game.description.toLowerCase().includes(query) ||
        game.genre.some(g => g.toLowerCase().includes(query))
    );
    
    displayFilteredFavorites(filteredGames);
}

/**
 * Displays filtered favorite games
 * @param {Array} games - Filtered games array
 */
function displayFilteredFavorites(games) {
    const container = document.getElementById('favoriteGamesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (games.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-8">
                <i class="fas fa-search text-gray-600 text-4xl mb-3"></i>
                <p class="text-gray-400">No favorites match your search</p>
            </div>
        `;
        return;
    }
    
    games.forEach(game => {
        const gameCard = createGameCard(game);
        container.appendChild(gameCard);
    });
}

/**
 * Removes a game from favorites
 * @param {number} gameId - Game ID to remove
 */
function removeFavorite(gameId) {
    storage.removeFavorite(gameId);
    
    // Remove from local array
    favoriteGames = favoriteGames.filter(game => game.id !== gameId);
    
    // Update display
    if (favoriteGames.length === 0) {
        showNoFavorites();
        hideFavoritesSearch();
    } else {
        displayFavoriteGames();
    }
    
    updateFavoriteCount(favoriteGames.length);
    
    // Show success message
    ui.showMessage('Game removed from favorites', 'success');
}

/**
 * Clears all favorite games
 */
function clearAllFavorites() {
    if (favoriteGames.length === 0) {
        ui.showMessage('No favorites to clear', 'info');
        return;
    }
    
    if (confirm('Are you sure you want to remove all favorite games?')) {
        storage.clearFavorites();
        favoriteGames = [];
        showNoFavorites();
        updateFavoriteCount(0);
        hideFavoritesSearch();
        ui.showMessage('All favorites cleared successfully', 'success');
    }
}

/**
 * Shows the profile content
 */
function showProfileContent() {
    const profileContent = document.getElementById('profileContent');
    const notLoggedIn = document.getElementById('notLoggedIn');
    
    if (profileContent) {
        profileContent.classList.remove('hidden');
    }
    
    if (notLoggedIn) {
        notLoggedIn.classList.add('hidden');
    }
}

/**
 * Shows the not logged in message
 */
function showNotLoggedIn() {
    const profileContent = document.getElementById('profileContent');
    const notLoggedIn = document.getElementById('notLoggedIn');
    
    if (profileContent) {
        profileContent.classList.add('hidden');
    }
    
    if (notLoggedIn) {
        notLoggedIn.classList.remove('hidden');
    }
    
    ui.hideLoading();
}

/**
 * Shows the favorites header
 */
function showFavoritesHeader() {
    const favoritesHeader = document.getElementById('favoritesHeader');
    if (favoritesHeader) {
        favoritesHeader.classList.remove('hidden');
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
 * Initialize the profile module
 */
function initProfile() {
    // Update auth UI
    ui.updateAuthUI();
    
    // Load profile
    loadProfile();
    
    // Setup edit profile button
    const editProfileButton = document.getElementById('editProfileButton');
    if (editProfileButton) {
        editProfileButton.addEventListener('click', toggleEditMode);
    }
    
    // Setup profile update form
    const updateProfileForm = document.getElementById('updateProfileForm');
    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // Setup cancel edit button
    const cancelEditButton = document.getElementById('cancelEditButton');
    if (cancelEditButton) {
        cancelEditButton.addEventListener('click', toggleEditMode);
    }
    
    // Setup favorites search
    const favoritesSearch = document.getElementById('favoritesSearch');
    if (favoritesSearch) {
        favoritesSearch.addEventListener('input', handleFavoritesSearch);
    }
    
    // Setup clear favorites button
    const clearFavoritesButton = document.getElementById('clearFavoritesButton');
    if (clearFavoritesButton) {
        clearFavoritesButton.addEventListener('click', clearAllFavorites);
    }
    
    // Setup logout
    setupLogout();
}

// Make removeFavorite globally available
window.removeFavorite = removeFavorite;

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProfile);
} else {
    initProfile();
} 