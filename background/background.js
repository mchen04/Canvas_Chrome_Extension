const CLIENT_ID = 'YOUR_CLIENT_ID'; // Replace with your actual client ID
const REDIRECT_URI = chrome.identity.getRedirectURL();
const AUTH_URL = `https://canvas.instructure.com/login/oauth2/auth?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
const TOKEN_URL = 'https://canvas.instructure.com/login/oauth2/token';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['access_token'], (result) => {
    if (!result.access_token) {
      initiateOAuth();
    }
  });
});

function initiateOAuth() {
  chrome.identity.launchWebAuthFlow({
    url: AUTH_URL,
    interactive: true
  }, (redirectUrl) => {
    if (chrome.runtime.lastError || !redirectUrl) {
      console.error("Error during authentication", chrome.runtime.lastError);
      return;
    }
    const code = new URL(redirectUrl).searchParams.get('code');
    exchangeCodeForToken(code);
  });
}

function exchangeCodeForToken(code) {
  const data = new URLSearchParams();
  data.append('grant_type', 'authorization_code');
  data.append('client_id', CLIENT_ID);
  data.append('code', code);
  data.append('redirect_uri', REDIRECT_URI);

  fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: data
  })
  .then(response => response.json())
  .then(tokenData => {
    chrome.storage.local.set({ access_token: tokenData.access_token }, () => {
      console.log('Access token saved');
    });
  })
  .catch(error => console.error('Error exchanging code for token:', error));
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchCanvasData') {
    fetchCanvasData();
  }
});

function fetchCanvasData() {
  chrome.storage.local.get(['access_token'], (result) => {
    if (result.access_token) {
      fetch('https://canvas.instructure.com/api/v1/courses', {
        headers: {
          'Authorization': `Bearer ${result.access_token}`
        }
      })
      .then(response => response.json())
      .then(courses => {
        chrome.storage.local.set({ courses: courses }, () => {
          console.log('Canvas data updated');
        });
      })
      .catch(error => console.error('Error fetching Canvas data:', error));
    } else {
      console.log('No access token found. Initiating OAuth flow.');
      initiateOAuth();
    }
  });
}