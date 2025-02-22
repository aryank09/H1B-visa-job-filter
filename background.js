chrome.runtime.onInstalled.addListener(() => {
    // Initialize storage defaults if they are not set
    chrome.storage.sync.get(["filterEnabled", "hideUnknown"], (data) => {
        if (data.filterEnabled === undefined) {
            chrome.storage.sync.set({ filterEnabled: true });
        }
        if (data.hideUnknown === undefined) {
            chrome.storage.sync.set({ hideUnknown: false });
        }
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "fetchH1BData") {
        const company = message.company;

        // Retrieve the toggle state from storage before making the API request
        chrome.storage.sync.get("hideUnknown", (data) => {
            const hideUnknownCompanies = data.hideUnknown ?? false;

            console.log(`Fetching H1B data for ${company} | Hide Unknown: ${hideUnknownCompanies}`);

            fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    companies: [company],
                    hideUnknownCompanies: hideUnknownCompanies
                })
            })
            .then(response => response.json())
            .then(data => {
                sendResponse({ success: true, data: data });
            })
            .catch(error => {
                console.error("API Request failed:", error);
                sendResponse({ success: false });
            });
        });

        return true; // Keep the message channel open until response is received
    }

    // Handle global filter toggling
    if (message.action === "toggleFiltering") {
        chrome.storage.sync.set({ filterEnabled: message.enabled }, () => {
            console.log(`🔄 Global filter state updated: ${message.enabled}`);
            // Notify all active content scripts of the change
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, { action: "updateFilterState", enabled: message.enabled });
                });
            });
        });
    }

    if (message.action === "toggleDatabaseFilter") {
        chrome.storage.sync.set({ hideUnknown: message.hide }, () => {
            console.log(`🔄 Hide unknown companies setting updated: ${message.hide}`);
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, { action: "updateDatabaseFilter", hide: message.hide });
                });
            });
        });
    }
});
