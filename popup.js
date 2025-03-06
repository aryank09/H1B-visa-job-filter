/**
 * Popup Script for H1B FastFilter
 * 
 * Description: This script manages the extension popup interface, handling user interactions,
 * state updates, and communication with the content script.
 * 
 * PRE-CONDITIONS: 
 * - The popup HTML must be loaded
 * - Chrome extension APIs must be available
 * - The content script must be running on the active tab
 * 
 * POST-CONDITIONS: 
 * - The popup UI will be initialized and interactive
 * - Statistics will be displayed and updated
 * - Filter state will be managed and synchronized
 * 
 * @param none
 * @return none
 */
document.addEventListener("DOMContentLoaded", function () {
    const toggleFilter = document.getElementById("toggleFilter");
    const statusText = document.getElementById("status");
    const totalJobsElement = document.getElementById("totalJobs");
    const sponsorCountElement = document.getElementById("sponsorCount");

    /**
     * showStatus
     * 
     * Description: Displays a status message in the popup for a specified duration.
     * 
     * PRE-CONDITIONS: 
     * - statusText element must exist
     * - Message must be provided
     * 
     * POST-CONDITIONS: 
     * - Status message will be displayed
     * - Message will be automatically hidden after duration
     * 
     * @param {string} message - The message to display
     * @param {number} duration - Duration in milliseconds (default: 2000)
     * @return none
     */
    function showStatus(message, duration = 2000) {
        statusText.textContent = message;
        statusText.classList.add('visible');
        setTimeout(() => {
            statusText.classList.remove('visible');
        }, duration);
    }

    /**
     * updateStats
     * 
     * Description: Updates the statistics display in the popup with current processing stats.
     * 
     * PRE-CONDITIONS: 
     * - Chrome storage API must be available
     * - Stats elements must exist in DOM
     * 
     * POST-CONDITIONS: 
     * - Statistics will be updated in the UI
     * 
     * @param none
     * @return none
     */
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