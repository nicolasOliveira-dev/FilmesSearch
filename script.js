/* ==========================================================================
   PaísesSearch - Dynamic Application Logic (API & Database Integration)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // App State
    let countries = [];
    let isCatalogVisible = false;
    let searchQuery = '';
    let selectedContinentFilter = '';

    // DOM Elements
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const searchContinentFilter = document.getElementById('searchContinentFilter');
    const addCountryForm = document.getElementById('addCountryForm');
    const countryNameInput = document.getElementById('countryName');
    const countryContinentSelect = document.getElementById('countryContinent');
    const countryCapitalInput = document.getElementById('countryCapital');
    const countryPopulationInput = document.getElementById('countryPopulation');
    
    const catalogSection = document.getElementById('catalogSection');
    const countryList = document.getElementById('countryList');
    const countryCountBadge = document.getElementById('countryCountBadge');
    const navCountryCountBadge = document.getElementById('navCountryCountBadge');
    const toggleCatalogBtn = document.getElementById('toggleCatalogBtn');
    const closeCatalogBtn = document.getElementById('closeCatalogBtn');
    const noResults = document.getElementById('noResults');
    const noResultsText = document.getElementById('noResultsText');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    // Initialize Page by loading countries from the backend API
    carregarPaisesDoBanco();

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

    // Search Input (Text search by name or capital)
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        clearSearchBtn.classList.toggle('hidden', searchQuery === '');

        // Auto-open catalog when user searches
        if (searchQuery !== '' || selectedContinentFilter !== '') {
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

    // Continent Filter Select Dropdown
    searchContinentFilter.addEventListener('change', (e) => {
        selectedContinentFilter = e.target.value;

        // Auto-open catalog when a continent is selected
        if (selectedContinentFilter !== '' || searchQuery !== '') {
            setCatalogVisibility(true);
        }
        renderCatalog();
    });

    // Form Submit - Add Country to Database
    addCountryForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = countryNameInput.value.trim();
        const continente = countryContinentSelect.value;
        const capital = countryCapitalInput.value.trim();
        const populacao = countryPopulationInput.value.trim();

        if (!nome || !continente || !capital || !populacao) {
            showToast('Por favor, preencha todos os campos do país.', 'error');
            return;
        }

        try {
            const response = await fetch('/api/paises', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    nome: nome, 
                    continente: continente,
                    capital: capital,
                    populacao: populacao 
                })
            });

            if (response.ok) {
                addCountryForm.reset();
                await carregarPaisesDoBanco();
                setCatalogVisibility(true);
                showToast(`País "${nome}" cadastrado com sucesso!`);
            } else {
                showToast('Erro ao salvar o país no banco de dados.', 'error');
            }
        } catch (err) {
            showToast('Falha de conexão com o servidor.', 'error');
        }
    });

    // ----------------------------------------------------------------------
    // Core Logic Functions
    // ----------------------------------------------------------------------

    async function carregarPaisesDoBanco() {
        try {
            const response = await fetch('/api/paises');
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    countries = data;
                    updateBadgeCount();
                    if (isCatalogVisible) {
                        renderCatalog();
                    }
                }
            } else {
                showToast('Erro ao carregar países do banco de dados.', 'error');
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

        // Filter countries by search query and selected continent
        const filtered = countries.filter(country => {
            const matchesTextSearch = searchQuery === '' || 
                (country.nome && country.nome.toLowerCase().includes(searchQuery)) || 
                (country.capital && country.capital.toLowerCase().includes(searchQuery)) ||
                (country.continente && country.continente.toLowerCase().includes(searchQuery));

            const matchesContinentDropdown = selectedContinentFilter === '' || 
                country.continente === selectedContinentFilter;

            return matchesTextSearch && matchesContinentDropdown;
        });

        countryCountBadge.textContent = filtered.length;
        countryList.innerHTML = '';

        if (filtered.length === 0) {
            noResults.classList.remove('hidden');
            if (countries.length === 0) {
                noResultsText.textContent = 'Nenhum país cadastrado no banco de dados ainda. Utilize o formulário acima para cadastrar!';
            } else {
                noResultsText.textContent = 'Nenhum país encontrado com os critérios de pesquisa informados.';
            }
        } else {
            noResults.classList.add('hidden');
            filtered.forEach(country => {
                const card = createCountryCard(country);
                countryList.appendChild(card);
            });
        }
    }

    function createCountryCard(country) {
        const card = document.createElement('div');
        card.className = 'country-card';

        card.innerHTML = `
            <div class="country-info">
                <span class="continent-badge"><i class="fa-solid fa-compass"></i> ${escapeHtml(country.continente)}</span>
                <h3 class="country-info-title">${escapeHtml(country.nome)}</h3>
                <div class="country-details">
                    <span class="country-detail-item">
                        <i class="fa-solid fa-building-columns"></i> Capital: <strong>${escapeHtml(country.capital)}</strong>
                    </span>
                    <span class="country-detail-item">
                        <i class="fa-solid fa-users"></i> Pop.: <strong>${escapeHtml(country.populacao)}</strong>
                    </span>
                </div>
            </div>
            <button class="delete-btn" title="Remover país do acervo" data-id="${country.id}">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `;

        const deleteBtn = card.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCountry(country.id, country.nome);
        });

        return card;
    }

    async function deleteCountry(id, nome) {
        if (confirm(`Deseja remover "${nome}" do acervo de países?`)) {
            try {
                const response = await fetch(`/api/paises/${id}`, { method: 'DELETE' });
                if (response.ok) {
                    await carregarPaisesDoBanco();
                    showToast(`País "${nome}" removido do banco de dados.`);
                } else {
                    showToast('Erro ao remover o país do banco de dados.', 'error');
                }
            } catch (err) {
                showToast('Falha na comunicação com o servidor/banco de dados.', 'error');
            }
        }
    }

    function updateBadgeCount() {
        const count = countries.length;
        if (countryCountBadge) countryCountBadge.textContent = count;
        if (navCountryCountBadge) navCountryCountBadge.textContent = count;
    }

    function showToast(message, type = 'success') {
        toastMessage.textContent = message;
        const icon = toast.querySelector('.toast-icon');

        if (type === 'error') {
            icon.className = 'toast-icon fa-solid fa-circle-exclamation';
            toast.style.borderLeftColor = '#ef4444';
        } else {
            icon.className = 'toast-icon fa-solid fa-circle-check';
            toast.style.borderLeftColor = 'var(--emerald-primary)';
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
