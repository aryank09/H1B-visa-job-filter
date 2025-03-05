document.addEventListener("DOMContentLoaded", function () {
    const toggleFilter = document.getElementById("toggleFilter");
    const statusText = document.getElementById("status");

    function showStatus(message, duration = 2000) {
        statusText.textContent = message;
        statusText.classList.add('visible');
        setTimeout(() => {
            statusText.classList.remove('visible');
        }, duration);
    }

    // Load initial state
    chrome.storage.sync.get("filterEnabled", (data) => {
        const isEnabled = data.filterEnabled ?? false;
        toggleFilter.checked = isEnabled;
        console.log("Initial filter state:", isEnabled);
        
        if (isEnabled) {
            showStatus("Filter is active - Scroll through jobs to process them", 3000);
        }
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
});

//TODO: need to add a pop on the screen visible to user all the time and add progress bar for the user to wait