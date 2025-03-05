document.addEventListener("DOMContentLoaded", function () {
    const toggleFilter = document.getElementById("toggleFilter");
    const statusText = document.createElement("div");
    statusText.id = "status";
    document.body.appendChild(statusText);

    // Load initial state
    chrome.storage.sync.get("filterEnabled", (data) => {
        // Set the toggle to match storage, default to false if not set
        const isEnabled = data.filterEnabled ?? false;
        toggleFilter.checked = isEnabled;
        console.log("Initial filter state:", isEnabled);
    });

    // Handle changes for main filter
    toggleFilter.addEventListener("change", function () {
        const newState = toggleFilter.checked;
        console.log("Toggle changed to:", newState);
        
        statusText.textContent = "Updating filter settings...";
        
        // Update storage and notify content script
        chrome.storage.sync.set({ filterEnabled: newState }, () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.runtime.sendMessage({ 
                    action: "toggleFiltering", 
                    enabled: newState
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error("Error:", chrome.runtime.lastError);
                        statusText.textContent = "Error updating settings";
                    } else {
                        statusText.textContent = `Filtering ${newState ? 'enabled' : 'disabled'}`;
                    }
                    setTimeout(() => { statusText.textContent = ''; }, 2000);
                });
            });
        });
    });
});

//TODO: need to add a pop on the screen visible to user all the time and add progress bar for the user to wait