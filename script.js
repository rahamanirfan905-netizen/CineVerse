/* ============================================================
   CineVerse — script.js
   Milestone 3 + 4: Search, Filter, Sort, Favorites, Dark Mode
   Bonus: Debounce, LocalStorage, Movie Detail Modal
   ============================================================ */

const API_KEY = 'b4b376f3';
const OMDB_BASE = `https://www.omdbapi.com/?apikey=${API_KEY}`;

/* ── DOM refs ─────────────────────────────────────────────── */
const movieGrid          = document.getElementById('movie-grid');
const loadingIndicator   = document.getElementById('loading-indicator');
const errorMessage       = document.getElementById('error-message');
const retryBtn           = document.getElementById('retry-btn');
const searchInput        = document.getElementById('search-input');
const typeFilter         = document.getElementById('type-filter');
const sortFilter         = document.getElementById('sort-filter');
const themeToggle        = document.getElementById('theme-toggle');
const showFavoritesBtn   = document.getElementById('show-favorites-btn');
const modalOverlay       = document.getElementById('modal-overlay');
const modalClose         = document.getElementById('modal-close');

/* ── App State ────────────────────────────────────────────── */
let allMovies      = [];   // full fetched catalog
let favorites      = [];   // imdbIDs of favorited movies
let showingFavs    = false;
let isLoading      = false;

/* ── Seed queries to build a diverse catalog ──────────────── */
const SEED_QUERIES = ['marvel', 'batman', 'star wars', 'james bond', 'harry potter'];

/* ============================================================
   BONUS: Debounce utility
   ============================================================ */
/**
 * Returns a debounced version of a function.
 * The returned function delays invoking `fn` until `delay` ms
 * have elapsed since the last invocation.
 * @param {Function} fn  - Function to debounce
 * @param {number}  delay - Milliseconds to wait
 */
function debounce(fn, delay) {
  let timerId;
  return function (...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* ============================================================
   BONUS: LocalStorage helpers
   ============================================================ */
function loadFavorites() {
  try {
    const stored = localStorage.getItem('cineverse_favorites');
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveFavorites() {
  localStorage.setItem('cineverse_favorites', JSON.stringify(favorites));
}

function loadTheme() {
  return localStorage.getItem('cineverse_theme') || 'dark';
}

function saveTheme(theme) {
  localStorage.setItem('cineverse_theme', theme);
}

/* ============================================================
   Theme Toggle (Dark / Light Mode)
   ============================================================ */
function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light-mode');
    themeToggle.textContent = '☀️';
  } else {
    document.body.classList.remove('light-mode');
    themeToggle.textContent = '🌙';
  }
}

themeToggle.addEventListener('click', () => {
  const isLight = document.body.classList.toggle('light-mode');
  const theme = isLight ? 'light' : 'dark';
  themeToggle.textContent = isLight ? '☀️' : '🌙';
  saveTheme(theme);
});

/* ============================================================
   FETCH — Build catalog from multiple queries
   ============================================================ */
async function fetchCatalog() {
  if (isLoading) return;
  isLoading = true;
  showLoading();

  try {
    // For each seed query, fetch up to 3 pages (max 30 results per query × 5 = up to 150 raw)
    const fetchPromises = SEED_QUERIES.flatMap(query =>
      [1, 2, 3].map(page =>
        fetch(`${OMDB_BASE}&s=${encodeURIComponent(query)}&page=${page}`)
          .then(r => r.json())
          .catch(() => ({ Response: 'False' }))
      )
    );

    const results = await Promise.all(fetchPromises);

    // Flatten and deduplicate using Array HOF: reduce to accumulate unique imdbIDs
    const seen = new Set();
    allMovies = results
      .filter(r => r.Response === 'True' && Array.isArray(r.Search))
      .flatMap(r => r.Search)
      .filter(movie => {
        if (seen.has(movie.imdbID)) return false;
        seen.add(movie.imdbID);
        return true;
      });

    if (allMovies.length === 0) throw new Error('No movies found in catalog.');

    renderMovies(getFilteredAndSorted());
  } catch (err) {
    console.error('Catalog fetch error:', err);
    showError();
  } finally {
    isLoading = false;
  }
}

/* ============================================================
   ARRAY HOFs — Filter + Sort Pipeline
   ============================================================ */

/**
 * Applies search, type filter, and sort to `allMovies`.
 * Uses ONLY Array HOFs: filter(), sort(), includes(), find().
 * @returns {Array} processed array to render
 */
function getFilteredAndSorted() {
  const query      = searchInput.value.trim().toLowerCase();
  const typeVal    = typeFilter.value;
  const sortVal    = sortFilter.value;

  // HOF: filter by favorites first (if in fav mode)
  let pool = showingFavs
    ? allMovies.filter(m => favorites.includes(m.imdbID))
    : allMovies;

  // HOF: filter by search keyword using String.prototype.includes
  if (query) {
    pool = pool.filter(m =>
      m.Title.toLowerCase().includes(query)
    );
  }

  // HOF: filter by type
  if (typeVal) {
    pool = pool.filter(m => m.Type === typeVal);
  }

  // HOF: sort using Array.prototype.sort
  if (sortVal === 'year-desc') {
    pool = pool.sort((a, b) => parseInt(b.Year) - parseInt(a.Year));
  } else if (sortVal === 'year-asc') {
    pool = pool.sort((a, b) => parseInt(a.Year) - parseInt(b.Year));
  } else if (sortVal === 'title-asc') {
    pool = pool.sort((a, b) => a.Title.localeCompare(b.Title));
  } else if (sortVal === 'title-desc') {
    pool = pool.sort((a, b) => b.Title.localeCompare(a.Title));
  }

  return pool;
}

/* ============================================================
   RENDER — Movie Grid
   ============================================================ */
function renderMovies(movies) {
  movieGrid.innerHTML = '';
  loadingIndicator.classList.add('hidden');
  errorMessage.classList.add('hidden');

  // Update results count in the filter bar
  let countEl = document.getElementById('results-count');
  if (countEl) countEl.textContent = `${movies.length} result${movies.length !== 1 ? 's' : ''}`;

  if (movies.length === 0) {
    movieGrid.classList.remove('hidden');
    movieGrid.innerHTML = `
      <div class="no-results" style="grid-column:1/-1">
        <div class="no-results-icon">🎬</div>
        <p>No movies found. Try a different search or filter.</p>
      </div>`;
    return;
  }

  movieGrid.classList.remove('hidden');

  // HOF: map each movie object to an HTML card element
  const cards = movies.map((movie, index) => {
    const poster = movie.Poster !== 'N/A'
      ? movie.Poster
      : `https://placehold.co/300x450/141929/6366f1?text=${encodeURIComponent(movie.Title)}`;

    const isFav = favorites.includes(movie.imdbID);   // HOF: includes

    const card = document.createElement('article');
    card.className = 'movie-card animate-entry';
    card.style.animationDelay = `${Math.min(index * 0.05, 0.6)}s`;
    card.dataset.imdbid = movie.imdbID;

    card.innerHTML = `
      <div class="poster-container">
        <img src="${poster}" alt="${movie.Title} Poster" class="movie-poster" loading="lazy">
        <div class="poster-overlay">
          <div class="overlay-actions">
            <button class="overlay-btn view-detail-btn" data-id="${movie.imdbID}" aria-label="View details for ${movie.Title}">
              📋 Details
            </button>
          </div>
        </div>
        <span class="type-badge">${movie.Type}</span>
        <button class="fav-badge ${isFav ? 'is-favorite' : ''}"
                data-id="${movie.imdbID}"
                aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}"
                title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
          ${isFav ? '❤️' : '🤍'}
        </button>
      </div>
      <div class="movie-info">
        <h3 class="movie-title" title="${movie.Title}">${movie.Title}</h3>
        <div class="movie-meta">
          <span class="movie-year">${movie.Year}</span>
          <a class="movie-imdb-link"
             href="https://www.imdb.com/title/${movie.imdbID}/"
             target="_blank" rel="noopener"
             onclick="event.stopPropagation()">IMDb ↗</a>
        </div>
      </div>
    `;

    return card;
  });

  // Append all cards at once for performance
  cards.forEach(c => movieGrid.appendChild(c));
}

/* ============================================================
   FAVORITES — Toggle with HOF find/filter
   ============================================================ */
function toggleFavorite(imdbID) {
  // HOF: find to check existence
  const exists = favorites.find(id => id === imdbID);

  if (exists) {
    // HOF: filter to remove
    favorites = favorites.filter(id => id !== imdbID);
  } else {
    favorites = [...favorites, imdbID];
  }

  saveFavorites();

  // Update the specific badge without a full re-render
  document.querySelectorAll(`.fav-badge[data-id="${imdbID}"]`).forEach(badge => {
    const isFav = favorites.includes(imdbID);
    badge.classList.toggle('is-favorite', isFav);
    badge.textContent = isFav ? '❤️' : '🤍';
    badge.setAttribute('aria-label', isFav ? 'Remove from favorites' : 'Add to favorites');
    badge.setAttribute('title',      isFav ? 'Remove from favorites' : 'Add to favorites');
    if (isFav) badge.style.animation = 'none', void badge.offsetWidth, badge.style.animation = '';
  });

  // If currently in "fav mode", re-render so removed items disappear
  if (showingFavs) renderMovies(getFilteredAndSorted());
}

/* ============================================================
   MOVIE DETAIL MODAL
   ============================================================ */
async function openModal(imdbID) {
  const modalBody = document.getElementById('modal-body');
  modalBody.innerHTML = `<div class="modal-loader"><div class="spinner"></div></div>`;
  modalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  try {
    const res  = await fetch(`${OMDB_BASE}&i=${imdbID}&plot=short`);
    const data = await res.json();

    if (data.Response !== 'True') throw new Error('Movie not found');

    const poster = data.Poster !== 'N/A'
      ? data.Poster
      : `https://placehold.co/180x270/141929/6366f1?text=No+Poster`;

    const isFav = favorites.includes(imdbID);

    modalBody.innerHTML = `
      <img class="modal-poster" src="${poster}" alt="${data.Title} poster">
      <div class="modal-details">
        <h2 class="modal-title">${data.Title}</h2>
        <div class="modal-rating">⭐ ${data.imdbRating} / 10 <span style="color:var(--text-muted);font-size:0.8rem">(${data.imdbVotes} votes)</span></div>
        <div class="modal-tags">
          ${data.Genre.split(',').map(g => `<span class="modal-tag">${g.trim()}</span>`).join('')}
        </div>
        <p class="modal-plot">${data.Plot}</p>
        <div class="modal-info-grid">
          <span class="modal-info-label">Year</span>   <span class="modal-info-value">${data.Year}</span>
          <span class="modal-info-label">Rated</span>  <span class="modal-info-value">${data.Rated}</span>
          <span class="modal-info-label">Runtime</span><span class="modal-info-value">${data.Runtime}</span>
          <span class="modal-info-label">Director</span><span class="modal-info-value">${data.Director}</span>
          <span class="modal-info-label">Cast</span>   <span class="modal-info-value">${data.Actors}</span>
          <span class="modal-info-label">Language</span><span class="modal-info-value">${data.Language}</span>
        </div>
        <div style="display:flex;gap:0.75rem;margin-top:0.5rem;flex-wrap:wrap">
          <button class="btn fav-badge ${isFav ? 'is-favorite' : ''}"
                  id="modal-fav-btn" data-id="${imdbID}"
                  style="width:auto;height:auto;border-radius:10px;position:relative;inset:auto;background:${isFav ? 'rgba(239,68,68,0.85)' : 'var(--surface-2)'};border:1.5px solid ${isFav ? '#ef4444' : 'var(--border)'}">
            ${isFav ? '❤️ Favorited' : '🤍 Add to Favorites'}
          </button>
          <a href="https://www.imdb.com/title/${imdbID}/" target="_blank" rel="noopener" class="btn"
             style="text-decoration:none;font-size:0.85rem">IMDb Page ↗</a>
        </div>
      </div>
    `;
  } catch {
    modalBody.innerHTML = `<p style="color:var(--error);text-align:center;padding:2rem">Could not load movie details.</p>`;
  }
}

function closeModal() {
  modalOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

/* ============================================================
   Event Delegation — Grid clicks
   ============================================================ */
movieGrid.addEventListener('click', e => {
  const favBtn    = e.target.closest('.fav-badge');
  const detailBtn = e.target.closest('.view-detail-btn');

  if (favBtn)    { e.stopPropagation(); toggleFavorite(favBtn.dataset.id); return; }
  if (detailBtn) { e.stopPropagation(); openModal(detailBtn.dataset.id);   return; }
});

/* Modal fav button (delegated from overlay) */
modalOverlay.addEventListener('click', e => {
  const favBtn = e.target.closest('#modal-fav-btn');
  if (favBtn) {
    toggleFavorite(favBtn.dataset.id);
    // Update modal button text
    const isFav = favorites.includes(favBtn.dataset.id);
    favBtn.textContent = isFav ? '❤️ Favorited' : '🤍 Add to Favorites';
    favBtn.style.background    = isFav ? 'rgba(239,68,68,0.85)' : 'var(--surface-2)';
    favBtn.style.borderColor   = isFav ? '#ef4444' : 'var(--border)';
  }
});

/* Close modal on backdrop or button */
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ============================================================
   Control Listeners — Search (debounced), Filter, Sort, Favs
   ============================================================ */

// BONUS Debounce: 350ms delay on search so we don't re-render on every keystroke
const handleSearch = debounce(() => renderMovies(getFilteredAndSorted()), 350);
searchInput.addEventListener('input', handleSearch);

typeFilter.addEventListener('change', () => renderMovies(getFilteredAndSorted()));
sortFilter.addEventListener('change', () => renderMovies(getFilteredAndSorted()));

showFavoritesBtn.addEventListener('click', () => {
  showingFavs = !showingFavs;
  showFavoritesBtn.classList.toggle('active', showingFavs);
  showFavoritesBtn.textContent = showingFavs ? '🎬 All Movies' : 'My Favs ❤️';
  renderMovies(getFilteredAndSorted());
});

retryBtn.addEventListener('click', fetchCatalog);

/* ============================================================
   UI State helpers
   ============================================================ */
function showLoading() {
  loadingIndicator.classList.remove('hidden');
  errorMessage.classList.add('hidden');
  movieGrid.classList.add('hidden');
}

function showError() {
  loadingIndicator.classList.add('hidden');
  errorMessage.classList.remove('hidden');
  movieGrid.classList.add('hidden');
}

/* ============================================================
   Bootstrap
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Restore favorites and theme from LocalStorage
  favorites = loadFavorites();
  applyTheme(loadTheme());

  // Kick off the catalog fetch
  fetchCatalog();
});
