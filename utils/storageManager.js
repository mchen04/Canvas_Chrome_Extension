// This file will contain functions to interact with Chrome's storage API

function saveData(key, data) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({[key]: data}, function() {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve();
            }
        });
    });
}

function getData(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([key], function(result) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result[key]);
            }
        });
    });
}

function removeData(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.remove([key], function() {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve();
            }
        });
    });
}

export { saveData, getData, removeData };