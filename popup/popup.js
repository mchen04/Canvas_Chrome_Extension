document.addEventListener('DOMContentLoaded', function() {
  const openDashboardButton = document.getElementById('open-dashboard');
  
  openDashboardButton.addEventListener('click', function() {
      chrome.runtime.sendMessage({ action: 'openDashboard' });
      window.close();
  });
});