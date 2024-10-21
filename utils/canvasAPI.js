// This file will contain functions to interact with the Canvas API

const CANVAS_API_URL = 'https://canvas.instructure.com/api/v1';

async function fetchCourses() {
    // In a real implementation, you would fetch this from the Canvas API
    // For now, we'll return mock data
    return [
        { id: 1, name: 'Math 101' },
        { id: 2, name: 'Biology 202' },
        { id: 3, name: 'History 301' }
    ];
}

async function fetchAssignments(courseId) {
    // In a real implementation, you would fetch this from the Canvas API
    // For now, we'll return mock data
    return [
        { id: 1, name: 'Homework 1', due_at: '2024-10-25T23:59:59Z' },
        { id: 2, name: 'Lab Report', due_at: '2024-10-28T23:59:59Z' },
        { id: 3, name: 'Reading Assignment', due_at: '2024-11-01T23:59:59Z' }
    ];
}

async function fetchAnnouncements(courseId) {
    // In a real implementation, you would fetch this from the Canvas API
    // For now, we'll return mock data
    return [
        { id: 1, title: 'Welcome to the course', message: 'Hello everyone!' },
        { id: 2, title: 'Midterm date change', message: 'The midterm has been moved to next week.' }
    ];
}

export { fetchCourses, fetchAssignments, fetchAnnouncements };