async function summarizeTabContent(tabId) {
    try {
        // Check if tab exists and get its URL
        const tab = await chrome.tabs.get(tabId);
        
        // Skip chrome:// URLs and other restricted URLs
        if (tab.url.startsWith('chrome://') || 
            tab.url.startsWith('chrome-extension://') ||
            tab.url.startsWith('edge://') ||
            tab.url.startsWith('about:') ||
            tab.url.startsWith('chrome-search://')) {
            return `System page: ${tab.title}`;
        }

        // Execute content script to get page text
        try {
            const response = await chrome.scripting.executeScript({
                target: { tabId },
                function: () => {
                    // Get main content text while avoiding common navigation elements
                    const content = document.body.cloneNode(true);
                    // Remove script and style elements
                    const scripts = content.getElementsByTagName('script');
                    const styles = content.getElementsByTagName('style');
                    for (let i = scripts.length - 1; i >= 0; i--) {
                        scripts[i].remove();
                    }
                    for (let i = styles.length - 1; i >= 0; i--) {
                        styles[i].remove();
                    }
                    return content.textContent
                        .replace(/\\s+/g, ' ')
                        .trim()
                        .substring(0, 1000); // Limit text length
                }
            });
            
            const pageText = response[0].result;
            
            if (!pageText || pageText.length < 10) {
                return `No content available for: ${tab.title}`;
            }

            // Using Chrome's built-in AI API
            try {
                const summary = await chrome.runtime.sendMessage({
                    type: 'google.ai.summarize',
                    text: pageText,
                    options: {
                        maxLength: 100,
                        format: 'paragraph'
                    }
                });
                return summary || `Unable to summarize: ${tab.title}`;
            } catch (aiError) {
                console.error('AI summarization failed:', aiError);
                return `Content from: ${tab.title}`;
            }
        } catch (scriptError) {
            console.error('Script execution failed:', scriptError);
            return `Unable to access content: ${tab.title}`;
        }
    } catch (error) {
        console.error('Tab access failed:', error);
        return 'Tab no longer exists';
    }
}

async function categorizeContent(text, title = '') {
    const categories = [
        'Research',
        'Assignments',
        'Lecture Notes',
        'Miscellaneous'
    ];
    
    // If text is a system message or error message, categorize as Miscellaneous
    if (text.startsWith('System page:') || 
        text.startsWith('Unable to access') ||
        text.startsWith('No content available') ||
        text.startsWith('Tab no longer exists')) {
        return 'Miscellaneous';
    }

    try {
        // Combine title and text for better categorization
        const contentToAnalyze = `Title: ${title}\nContent: ${text}`;
        
        const result = await chrome.runtime.sendMessage({
            type: 'google.ai.generate',
            prompt: `Categorize the following content into one of these categories: ${categories.join(', ')}. Content: ${contentToAnalyze}`
        });
        
        // Validate the result is one of our categories
        const category = result.trim();
        return categories.includes(category) ? category : 'Miscellaneous';
    } catch (error) {
        console.error('Categorization failed:', error);
        return 'Miscellaneous';
    }
}

export { summarizeTabContent, categorizeContent };