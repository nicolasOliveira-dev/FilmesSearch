/* ==========================================================================
   FilmesSearch - Dynamic Application Logic (Database Integration)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // App State: loaded directly from the database endpoint
    let movies = [];
    let isCatalogVisible = false;
    let searchQuery = '';
    let selectedGenreFilter = '';

    // DOM Elements
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const searchGenreFilter = document.getElementById('searchGenreFilter');
    const addMovieForm = document.getElementById('addMovieForm');
    const movieNameInput = document.getElementById('movieName');
    const movieGenreSelect = document.getElementById('movieGenre');
    const catalogSection = document.getElementById('catalogSection');
    const movieList = document.getElementById('movieList');
    const movieCountBadge = document.getElementById('movieCountBadge');
    const navMovieCountBadge = document.getElementById('navMovieCountBadge');
    const toggleCatalogBtn = document.getElementById('toggleCatalogBtn');
    const closeCatalogBtn = document.getElementById('closeCatalogBtn');
    const noResults = document.getElementById('noResults');
    const noResultsText = document.getElementById('noResultsText');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    // Initialize Page by loading movies from the database
    carregarFilmesDoBanco();

    // ----------------------------------------------------------------------
    // Event Listeners
    // ----------------------------------------------------------------------

    // Toggle Acervo section on button click
    toggleCatalogBtn.addEventListener('click', () => {
        isCatalogVisible = !isCatalogVisible;
        setCatalogVisibility(isCatalogVisible);
    });

    // Close Acervo button inside catalog header
    closeCatalogBtn.addEventListener('click', () => {
        isCatalogVisible = false;
        setCatalogVisibility(false);
    });

    // Search Input (Text search by name or genre)
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        clearSearchBtn.classList.toggle('hidden', searchQuery === '');

        // Auto-open catalog when user searches
        if (searchQuery !== '' || selectedGenreFilter !== '') {
            setCatalogVisibility(true);
        }
        renderCatalog();
    });

    // Clear Search Button
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.classList.add('hidden');
        searchInput.focus();
        renderCatalog();
    });

    // Genre Filter Select Dropdown
    searchGenreFilter.addEventListener('change', (e) => {
        selectedGenreFilter = e.target.value;

        // Auto-open catalog when a genre is selected
        if (selectedGenreFilter !== '' || searchQuery !== '') {
            setCatalogVisibility(true);
        }
        renderCatalog();
    });

    // Form Submit - Add Movie to Database
    addMovieForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = movieNameInput.value.trim();
        const genero = movieGenreSelect.value;

        if (!nome || !genero) {
            showToast('Por favor, preencha todos os campos.', 'error');
            return;
        }

        try {
            const response = await fetch('/api/filmes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: nome, genero: genero })
            });

            if (response.ok) {
                addMovieForm.reset();
                await carregarFilmesDoBanco();
                setCatalogVisibility(true);
                showToast(`Filme "${nome}" cadastrado com sucesso no banco de dados!`);
            } else {
                showToast('Erro ao salvar o filme no banco de dados.', 'error');
            }
        } catch (err) {
            showToast('Falha de conexão com o banco de dados.', 'error');
        }
    });

    // ----------------------------------------------------------------------
    // Core Logic Functions
    // ----------------------------------------------------------------------

    async function carregarFilmesDoBanco() {
        try {
            const response = await fetch('/api/filmes');
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    movies = data;
                    updateBadgeCount();
                    if (isCatalogVisible) {
                        renderCatalog();
                    }
                }
            } else {
                showToast('Erro ao carregar filmes do banco de dados.', 'error');
            }
        } catch (err) {
            showToast('Não foi possível conectar ao banco de dados.', 'error');
        }
    }

    function setCatalogVisibility(visible) {
        isCatalogVisible = visible;
        catalogSection.classList.toggle('hidden', !visible);
        toggleCatalogBtn.classList.toggle('active', visible);

        if (visible) {
            renderCatalog();
        }
    }

    function renderCatalog() {
        if (!isCatalogVisible) return;

        // Filter movies by search query and selected genre
        const filtered = movies.filter(movie => {
            const matchesNameOrGenreSearch = searchQuery === '' || 
                (movie.nome && movie.nome.toLowerCase().includes(searchQuery)) || 
                (movie.genero && movie.genero.toLowerCase().includes(searchQuery));

            const matchesGenreDropdown = selectedGenreFilter === '' || 
                movie.genero === selectedGenreFilter;

            return matchesNameOrGenreSearch && matchesGenreDropdown;
        });

        movieCountBadge.textContent = filtered.length;
        movieList.innerHTML = '';

        if (filtered.length === 0) {
            noResults.classList.remove('hidden');
            if (movies.length === 0) {
                noResultsText.textContent = 'Nenhum filme cadastrado no banco de dados ainda. Preencha o formulário acima para cadastrar!';
            } else {
                noResultsText.textContent = 'Nenhum filme encontrado com os critérios de pesquisa informados.';
            }
        } else {
            noResults.classList.add('hidden');
            filtered.forEach(movie => {
                const card = createTextMovieCard(movie);
                movieList.appendChild(card);
            });
        }
    }

    function createTextMovieCard(movie) {
        const card = document.createElement('div');
        card.className = 'movie-text-card';

        card.innerHTML = `
            <div class="movie-info">
                <h3 class="movie-info-title">${escapeHtml(movie.nome)}</h3>
                <span class="movie-info-genre">${escapeHtml(movie.genero)}</span>
            </div>
            <button class="delete-btn" title="Remover filme do acervo" data-id="${movie.id}">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `;

        const deleteBtn = card.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteMovie(movie.id, movie.nome);
        });

        return card;
    }

    async function deleteMovie(id, nome) {
        if (confirm(`Deseja remover "${nome}" do acervo?`)) {
            try {
                const response = await fetch(`/api/filmes/${id}`, { method: 'DELETE' });
                if (response.ok) {
                    await carregarFilmesDoBanco();
                    showToast(`Filme "${nome}" removido do banco de dados.`);
                } else {
                    showToast('Erro ao remover o filme do banco de dados.', 'error');
                }
            } catch (err) {
                showToast('Falha na comunicação com o servidor/banco de dados.', 'error');
            }
        }
    }

    function updateBadgeCount() {
        const count = movies.length;
        if (movieCountBadge) movieCountBadge.textContent = count;
        if (navMovieCountBadge) navMovieCountBadge.textContent = count;
    }

    function showToast(message, type = 'success') {
        toastMessage.textContent = message;
        const icon = toast.querySelector('.toast-icon');

        if (type === 'error') {
            icon.className = 'toast-icon fa-solid fa-circle-exclamation';
            toast.style.borderLeftColor = '#ef4444';
        } else {
            icon.className = 'toast-icon fa-solid fa-circle-check';
            toast.style.borderLeftColor = 'var(--gold-primary)';
        }

        toast.classList.remove('hidden');

        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3500);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
