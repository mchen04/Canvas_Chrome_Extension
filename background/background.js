import { summarizeTabContent, categorizeContent } from './ai-summarizer.js';

let processingTabs = new Set();

// Handle AI API requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'google.ai.summarize') {
        // Use Chrome's built-in AI summarization
        chrome.runtime.sendNativeMessage(
            'com.google.chrome.ai',
            {
                text: message.text,
                maxLength: message.options?.maxLength || 100,
                format: message.options?.format || 'paragraph'
            },
            (response) => {
                sendResponse(response?.summary || 'Unable to generate summary');
            }
        );
        return true;
    }
    
    if (message.type === 'google.ai.generate') {
        // Use Chrome's built-in AI generation
        chrome.runtime.sendNativeMessage(
            'com.google.chrome.ai',
            {
                prompt: message.prompt
            },
            (response) => {
                sendResponse(response?.text || 'Miscellaneous');
            }
        );
        return true;
    }

    if (message.action === 'openDashboard') {
        chrome.tabs.create({
            url: chrome.runtime.getURL('dashboard/dashboard.html'),
            active: true
        });
    }
});

async function updateTabInfo(tabId, tab) {
    // Skip if tab is already being processed
    if (processingTabs.has(tabId)) return;
    
    try {
        processingTabs.add(tabId);
        
        // Skip certain URLs
        if (tab.url.startsWith('chrome://') || 
            tab.url.startsWith('chrome-extension://') ||
            tab.url.startsWith('about:')) {
            const tabInfo = {
                id: tabId,
                title: tab.title,
                url: tab.url,
                favicon: tab.favIconUrl || chrome.runtime.getURL('assets/default-favicon.png'),
                summary: `System page: ${tab.title}`,
                category: 'Miscellaneous',
                lastUpdated: new Date().toISOString()
            };
            await chrome.storage.local.set({ [tabId]: tabInfo });
            return;
        }

        const summary = await summarizeTabContent(tabId);
        const category = await categorizeContent(summary, tab.title);
        
        const tabInfo = {
            id: tabId,
            title: tab.title,
            url: tab.url,
            favicon: tab.favIconUrl || chrome.runtime.getURL('assets/default-favicon.png'),
            summary,
            category,
            lastUpdated: new Date().toISOString()
        };
        
        await chrome.storage.local.set({ [tabId]: tabInfo });
        updateCategoryBadge();
    } catch (error) {
        console.error('Error updating tab info:', error);
    } finally {
        processingTabs.delete(tabId);
    }
}

function updateCategoryBadge() {
    chrome.storage.local.get(null, (items) => {
        const categories = {};
        Object.values(items).forEach(tab => {
            if (tab.category && tab.id) { // Only count valid tabs
                categories[tab.category] = (categories[tab.category] || 0) + 1;
            }
        });
        
        const total = Object.values(categories).reduce((sum, count) => sum + count, 0);
        chrome.action.setBadgeText({ text: total.toString() });
        chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
    });
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        updateTabInfo(tabId, tab);
    }
});

// Clean up removed tabs
chrome.tabs.onRemoved.addListener((tabId) => {
    chrome.storage.local.remove(tabId.toString());
    updateCategoryBadge();
});