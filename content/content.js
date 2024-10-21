// This script will run on Canvas pages
console.log('Canvas Chrome Extension content script loaded');

// Here you can add code to interact with the Canvas page directly
// For example, you might want to extract information from the page
// or add custom UI elements

// Example: Extract the current page title
const pageTitle = document.title;
console.log('Current page title:', pageTitle);

// You can also send messages to the background script if needed
chrome.runtime.sendMessage({action: "pageLoaded", title: pageTitle});