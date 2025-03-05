document.addEventListener("DOMContentLoaded", function () {
    const toggleFilter = document.getElementById("toggleFilter");
    const statusText = document.getElementById("status");
    const totalJobsElement = document.getElementById("totalJobs");
    const sponsorCountElement = document.getElementById("sponsorCount");

    function showStatus(message, duration = 2000) {
        statusText.textContent = message;
        statusText.classList.add('visible');
        setTimeout(() => {
            statusText.classList.remove('visible');
        }, duration);
    }

    function updateStats() {
        chrome.storage.local.get(['processingStats'], (result) => {
            const stats = result.processingStats || { totalJobs: 0, sponsorCount: 0 };
            totalJobsElement.textContent = stats.totalJobs;
            sponsorCountElement.textContent = stats.sponsorCount;
        });
    }

    // Load initial state and stats
    chrome.storage.sync.get("filterEnabled", (data) => {
        const isEnabled = data.filterEnabled ?? false;
        toggleFilter.checked = isEnabled;
        console.log("Initial filter state:", isEnabled);
        
        if (isEnabled) {
            showStatus("Filter is active - Scroll through jobs to process them", 3000);
        }
        updateStats();
    });

    // Handle changes for main filter
    toggleFilter.addEventListener("change", function () {
        const newState = toggleFilter.checked;
        console.log("Toggle changed to:", newState);
        
        showStatus("Updating filter settings...");
        
        // Update storage and notify content script
        chrome.storage.sync.set({ filterEnabled: newState }, () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.runtime.sendMessage({ 
                    action: "toggleFiltering", 
                    enabled: newState
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error("Error:", chrome.runtime.lastError);
                        showStatus("Error updating settings", 3000);
                    } else {
                        const message = newState 
                            ? "Filter enabled - Scroll through jobs to process them"
                            : "Filter disabled - All jobs will be shown";
                        showStatus(message, 3000);
                    }
                });
            });
        });
    });

    // Listen for statistics updates
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "statsUpdate") {
            totalJobsElement.textContent = message.stats.totalJobs;
            sponsorCountElement.textContent = message.stats.sponsorCount;
        }
    });

    // Update stats every time popup is opened
    updateStats();
});

//TODO: need to add a pop on the screen visible to user all the time and add progress bar for the user to wait