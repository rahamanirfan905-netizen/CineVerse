# 🎬 CineVerse — Movie Explorer

> A dynamic, responsive movie discovery web application built with vanilla HTML, CSS, and JavaScript.

[![Live Demo](https://img.shields.io/badge/Live-Demo-6366f1?style=for-the-badge)](https://rahamanirfan905-netizen.github.io/CineVerse)
[![API](https://img.shields.io/badge/API-OMDb-f59e0b?style=for-the-badge)](http://www.omdbapi.com/)
[![Milestone](https://img.shields.io/badge/Milestone-4%20Complete-22c55e?style=for-the-badge)]()

---

## 📌 Project Overview

**CineVerse** is a fully functional, browser-based movie explorer that fetches real-time data from the [OMDb API](http://www.omdbapi.com/) and lets users search, filter, sort, and save their favourite films — all from a beautifully designed dark/light-mode interface.

---

## 🚀 Features

### ✅ Core Features (Milestone 3)

| Feature | Description | JS Mechanism |
|---|---|---|
| 🔍 **Search** | Real-time title search (debounced) | `Array.filter()` + `String.includes()` |
| 🎭 **Filter by Type** | Movie / Series / Episode dropdown | `Array.filter()` |
| 🔢 **Sort** | Year (asc/desc), Title (A–Z, Z–A) | `Array.sort()` |
| ❤️ **Favourites** | Add / remove from favourites | `Array.find()` + `Array.filter()` |
| 🌙 **Dark / Light Mode** | Theme toggle with persistent preference | CSS variables |

### ⭐ Bonus Features

| Feature | Description |
|---|---|
| ⚡ **Debouncing** | Search input fires after 350ms idle to avoid excessive calls |
| 💾 **Local Storage** | Favourites & theme saved across page reloads |
| 📋 **Movie Detail Modal** | Click "Details" to fetch and display full movie info (plot, cast, rating, genre) |
| 🎬 **Diverse Catalog** | Fetches from 5 seed queries × 3 pages = up to 150 unique movies |
| 💨 **Staggered Animations** | Cards animate in with staggered `fadeInScale` effect |
| ♿ **Accessibility** | ARIA labels, semantic HTML, keyboard-navigable modal (Escape to close) |

---

## 🛠️ Technologies Used

- **HTML5** — Semantic markup
- **CSS3** — CSS Variables, Grid, Flexbox, Animations, Dark/Light theme
- **JavaScript (ES6+)** — `async/await`, `fetch`, Array HOFs, destructuring, spread
- **OMDb API** — Movie data source (search + detail endpoints)
- **Google Fonts** — Outfit typeface

---

## 📐 Array HOFs Used

The project strictly uses **Higher-Order Functions** for all data manipulation — no traditional `for`/`while` loops for these operations:

```js
// Search — filter + includes
pool = pool.filter(m => m.Title.toLowerCase().includes(query));

// Filter by type
pool = pool.filter(m => m.Type === typeVal);

// Sort by year descending
pool = pool.sort((a, b) => parseInt(b.Year) - parseInt(a.Year));

// Sort alphabetically
pool = pool.sort((a, b) => a.Title.localeCompare(b.Title));

// Check if a movie is favorited — find
const exists = favorites.find(id => id === imdbID);

// Remove from favorites — filter
favorites = favorites.filter(id => id !== imdbID);

// Deduplicate catalog — reduce (via Set + filter)
allMovies = results
  .flatMap(r => r.Search)
  .filter(movie => { /* dedup via Set */ });

// Render cards — map
const cards = movies.map((movie, index) => { /* create card */ });
```

---

## 📁 Project Structure

```
CineVerse/
├── index.html      # App shell with semantic HTML
├── style.css       # Design system: variables, dark/light mode, components
├── script.js       # All JS logic: fetch, HOF pipeline, modal, debounce
└── README.md       # Project documentation
```

---

## ⚙️ Setup & Running Locally

No build tools or dependencies required.

```bash
# Clone the repository
git clone https://github.com/rahamanirfan905-netizen/CineVerse.git
cd CineVerse

# Open directly in browser
open index.html

# OR serve locally with any static server, e.g.:
npx serve .
# or
python3 -m http.server 8000
```

---

## 🔌 API Information

- **Provider**: [OMDb API](http://www.omdbapi.com/)
- **Endpoints used**:
  - `?s={query}&page={n}` — Search movies by keyword
  - `?i={imdbID}&plot=short` — Fetch full details for a specific movie
- **Free tier**: 1,000 requests/day
- **Key**: Stored directly in `script.js` — replace `b4b376f3` with your own if rate-limited

---

## 📊 Milestones

| Milestone | Description | Status |
|---|---|---|
| M1 | Project Setup & README | ✅ Done |
| M2 | API Integration & Responsive Layout | ✅ Done |
| M3 | Search, Filter, Sort, Favourites, Dark Mode | ✅ Done |
| M4 | Refactor, Documentation & Deployment | ✅ Done |

---

## 👤 Author

**Irfan Rahaman** — [@rahamanirfan905-netizen](https://github.com/rahamanirfan905-netizen)

---

*© 2024 CineVerse. Built for academic purposes using the OMDb public API.*
