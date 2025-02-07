document.addEventListener("DOMContentLoaded", function () {
    let toggleFilter = document.getElementById("toggleFilter");
    let toggleDatabaseFilter = document.getElementById("toggleDatabaseFilter");

    // Load saved states
    chrome.storage.sync.get(["filterEnabled", "hideUnknown"], function (data) {
        toggleFilter.checked = data.filterEnabled ?? true; // Default: ON
        toggleDatabaseFilter.checked = data.hideUnknown ?? false; // Default: OFF
    });

    // Handle changes for main filter
    toggleFilter.addEventListener("change", function () {
        chrome.storage.sync.set({ filterEnabled: toggleFilter.checked });
        chrome.runtime.sendMessage({ action: "toggleFiltering", enabled: toggleFilter.checked });
    });

    // Handle changes for database filter
    toggleDatabaseFilter.addEventListener("change", function () {
        chrome.storage.sync.set({ hideUnknown: toggleDatabaseFilter.checked });
        chrome.runtime.sendMessage({ action: "toggleDatabaseFilter", hide: toggleDatabaseFilter.checked });
    });
});
