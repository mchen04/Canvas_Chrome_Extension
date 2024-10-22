// Store the tabs we're tracking
let trackedTabs = new Map();
let currentCategory = 'all';
let currentSort = 'date';
const categoryColors = {
    'Research': '#FF6B6B',
    'Assignments': '#4ECDC4',
    'Lecture Notes': '#45B7D1',
    'Miscellaneous': '#96CEB4'
};

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeDashboard();
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        showError('Failed to initialize dashboard');
    }
});

async function initializeDashboard() {
    // First, get current tabs
    const currentTabs = await chrome.tabs.query({});
    const tabIds = new Set(currentTabs.map(tab => tab.id));

    // Get stored tab data
    const storedData = await chrome.storage.local.get(null);
    
    // Clean up stored data for tabs that no longer exist
    for (let key of Object.keys(storedData)) {
        if (key !== 'customCategories' && !tabIds.has(parseInt(key))) {
            await chrome.storage.local.remove(key);
        }
    }

    // Initialize UI components
    await Promise.all([
        initializeCategories(),
        initializeTabs(),
        initializeSearchFilter(),
        initializeLayoutToggle(),
        initializeSortControls()
    ]);

    // Add listeners for tab changes
    chrome.tabs.onUpdated.addListener(handleTabUpdate);
    chrome.tabs.onRemoved.addListener(handleTabRemove);
}

async function initializeCategories() {
    const categoriesDiv = document.getElementById('categories');
    if (!categoriesDiv) return;

    const defaultCategories = ['All', 'Research', 'Assignments', 'Lecture Notes', 'Miscellaneous'];
    
    categoriesDiv.innerHTML = defaultCategories.map(category => `
        <button class="category-btn ${category.toLowerCase() === currentCategory ? 'active' : ''}"
                onclick="filterTabsByCategory('${category.toLowerCase()}')">
            ${category}
        </button>
    `).join('');
}

async function initializeTabs() {
    const container = document.getElementById('dashboard-container');
    if (!container) return;

    try {
        const tabs = await chrome.tabs.query({});
        const storedData = await chrome.storage.local.get(null);

        container.innerHTML = '';
        
        for (const tab of tabs) {
            const tabData = storedData[tab.id] || {
                id: tab.id,
                title: tab.title,
                url: tab.url,
                favicon: tab.favIconUrl,
                category: 'Miscellaneous',
                summary: 'Loading summary...'
            };

            // Only show tabs that match current category filter
            if (currentCategory === 'all' || tabData.category.toLowerCase() === currentCategory) {
                const tabElement = createTabElement(tabData);
                container.appendChild(tabElement);
            }

            trackedTabs.set(tab.id, tabData);
        }

        updateTabCount(tabs.length);
    } catch (error) {
        console.error('Error initializing tabs:', error);
        showError('Failed to load tabs');
    }
}

function createTabElement(tabData) {
    const tabDiv = document.createElement('div');
    tabDiv.className = 'tab-card';
    tabDiv.dataset.tabId = tabData.id;

    // Safely create the HTML content
    tabDiv.innerHTML = `
        <img class="tab-favicon" src="${tabData.favicon || 'assets/default-favicon.png'}" 
             onerror="this.src='assets/default-favicon.png'">
        <div class="tab-content">
            <div class="tab-title">${escapeHtml(tabData.title)}</div>
            <div class="tab-summary">${escapeHtml(tabData.summary)}</div>
            <div class="tab-category">${escapeHtml(tabData.category)}</div>
        </div>
    `;

    // Add click handler
    tabDiv.addEventListener('click', async () => {
        try {
            await chrome.tabs.update(tabData.id, { active: true });
        } catch (error) {
            console.error('Failed to switch to tab:', error);
            showError('This tab no longer exists');
            tabDiv.remove();
            trackedTabs.delete(tabData.id);
        }
    });

    return tabDiv;
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function initializeSearchFilter() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const searchText = e.target.value.toLowerCase();
        const tabCards = document.querySelectorAll('.tab-card');

        tabCards.forEach(card => {
            const title = card.querySelector('.tab-title').textContent.toLowerCase();
            const summary = card.querySelector('.tab-summary').textContent.toLowerCase();
            card.style.display = (title.includes(searchText) || summary.includes(searchText)) ? '' : 'none';
        });
    });
}

function initializeLayoutToggle() {
    const toggle = document.getElementById('layout-toggle');
    const container = document.getElementById('dashboard-container');
    if (!toggle || !container) return;

    toggle.addEventListener('change', (e) => {
        container.className = e.target.checked ? 'list-layout' : 'grid-layout';
    });
}

function initializeSortControls() {
    const sortSelect = document.getElementById('sort-by');
    if (!sortSelect) return;

    sortSelect.value = currentSort;
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        sortTabs();
    });
}

async function handleTabUpdate(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        try {
            const tabData = {
                id: tab.id,
                title: tab.title,
                url: tab.url,
                favicon: tab.favIconUrl,
                category: 'Miscellaneous', // Will be updated by AI
                summary: 'Loading summary...',
                lastUpdated: new Date().toISOString()
            };

            trackedTabs.set(tabId, tabData);
            await updateTabDisplay(tabData);
        } catch (error) {
            console.error('Error handling tab update:', error);
        }
    }
}

function handleTabRemove(tabId) {
    const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
    if (tabElement) {
        tabElement.remove();
    }
    trackedTabs.delete(tabId);
    updateTabCount(trackedTabs.size);
}

async function updateTabDisplay(tabData) {
    const container = document.getElementById('dashboard-container');
    if (!container) return;

    const existingTab = document.querySelector(`[data-tab-id="${tabData.id}"]`);
    if (existingTab) {
        existingTab.replaceWith(createTabElement(tabData));
    } else {
        container.appendChild(createTabElement(tabData));
    }
}

function updateTabCount(count) {
    const countElement = document.getElementById('tab-count');
    if (countElement) {
        countElement.textContent = `${count} tab${count !== 1 ? 's' : ''}`;
    }
}

function filterTabsByCategory(category) {
    currentCategory = category;
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase() === category);
    });
    refreshTabDisplay();
}

function refreshTabDisplay() {
    const container = document.getElementById('dashboard-container');
    if (!container) return;

    Array.from(container.children).forEach(child => {
        const tabId = parseInt(child.dataset.tabId);
        const tabData = trackedTabs.get(tabId);
        if (tabData) {
            child.style.display = 
                (currentCategory === 'all' || tabData.category.toLowerCase() === currentCategory)
                ? ''
                : 'none';
        }
    });
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

function sortTabs() {
    const container = document.getElementById('dashboard-container');
    if (!container) return;

    const tabElements = Array.from(container.children);
    tabElements.sort((a, b) => {
        const tabA = trackedTabs.get(parseInt(a.dataset.tabId));
        const tabB = trackedTabs.get(parseInt(b.dataset.tabId));
        
        switch (currentSort) {
            case 'date':
                return new Date(tabB.lastUpdated) - new Date(tabA.lastUpdated);
            case 'name':
                return tabA.title.localeCompare(tabB.title);
            case 'category':
                return tabA.category.localeCompare(tabB.category);
            default:
                return 0;
        }
    });

    // Clear and re-append in sorted order
    container.innerHTML = '';
    tabElements.forEach(element => container.appendChild(element));
}

// Make functions available to the HTML onclick handlers
window.filterTabsByCategory = filterTabsByCategory;