document.addEventListener('DOMContentLoaded', function() {
    chrome.runtime.sendMessage({action: 'fetchCanvasData'});
    loadCourses();
  });
  
  function loadCourses() {
    chrome.storage.local.get(['courses'], function(result) {
      const courses = result.courses || [];
      const coursesList = document.getElementById('coursesList');
      coursesList.innerHTML = '';
      courses.forEach(course => {
        const li = document.createElement('li');
        li.textContent = course.name;
        coursesList.appendChild(li);
      });
    });
  }