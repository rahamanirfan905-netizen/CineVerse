const API_KEY = 'b4b376f3';
const API_URL = `https://www.omdbapi.com/?apikey=${API_KEY}`;

// DOM Elements
const movieGrid = document.getElementById('movie-grid');
const loadingIndicator = document.getElementById('loading-indicator');
const errorMessage = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');

// Initial load - Fetch some default movies since milestone 2 requires displaying data, 
// and search is in milestone 3.
const INITIAL_SEARCH_TERM = 'batman';

/**
 * Fetch movies from the OMDb API
 * @param {string} searchTerm - The movie title to search for
 */
async function fetchMovies(searchTerm) {
    try {
        // Show loading state
        showLoading();
        
        const response = await fetch(`${API_URL}&s=${searchTerm}`);
        
        // Handle HTTP errors
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Handle API level errors (like "Movie not found!")
        if (data.Response === "True") {
            displayMovies(data.Search);
        } else {
            throw new Error(data.Error || 'Failed to fetch movies');
        }
    } catch (error) {
        console.error('Error fetching movies:', error);
        showError();
    }
}

/**
 * Display a list of movies in the grid
 * @param {Array} movies - Array of movie objects
 */
function displayMovies(movies) {
    // Clear existing content
    movieGrid.innerHTML = '';
    
    // Hide loading/error states and show the grid
    loadingIndicator.classList.add('hidden');
    errorMessage.classList.add('hidden');
    movieGrid.classList.remove('hidden');
    
    // Create and append movie cards dynamically
    movies.forEach((movie, index) => {
        // Fallback for missing posters
        const posterSrc = movie.Poster !== 'N/A' 
            ? movie.Poster 
            : 'https://via.placeholder.com/300x450/1e293b/94a3b8?text=No+Poster';
        
        const card = document.createElement('article');
        card.className = 'movie-card animate-entry';
        
        // Stagger the entrance animation slightly for each card
        card.style.animationDelay = `${index * 0.1}s`;
        
        card.innerHTML = `
            <div class="poster-container">
                <img src="${posterSrc}" alt="${movie.Title} Poster" class="movie-poster" loading="lazy">
            </div>
            <div class="movie-info">
                <h3 class="movie-title" title="${movie.Title}">${movie.Title}</h3>
                <div class="movie-meta">
                    <span class="movie-year">${movie.Year}</span>
                    <span class="movie-type">${movie.Type}</span>
                </div>
            </div>
        `;
        
        movieGrid.appendChild(card);
    });
}

/**
 * Show the loading indicator and hide other content
 */
function showLoading() {
    loadingIndicator.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    movieGrid.classList.add('hidden');
}

/**
 * Show the error message and hide other content
 */
function showError() {
    loadingIndicator.classList.add('hidden');
    errorMessage.classList.remove('hidden');
    movieGrid.classList.add('hidden');
}

// Event Listeners
retryBtn.addEventListener('click', () => {
    fetchMovies(INITIAL_SEARCH_TERM);
});

// Initialize app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Artificial small delay to show off the loading state briefly if API is too fast
    setTimeout(() => {
        fetchMovies(INITIAL_SEARCH_TERM);
    }, 500);
});
