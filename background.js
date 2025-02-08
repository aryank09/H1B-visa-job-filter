const apiUrl = "you server address"; // Flask API URL
//TODO: remove your server address
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    //TODO: if condition to toggle filters
    if (message.action === "fetchH1BData") {
        const company = message.company;

        // Retrieve the toggle state from storage before making the API request
        chrome.storage.sync.get("hideUnknown", (data) => {
            const hideUnknownCompanies = data.hideUnknown ?? false; // Default to false

            console.log(`Fetching H1B data for ${company} | Hide Unknown: ${hideUnknownCompanies}`);

            // Send request to Flask API with hideUnknownCompanies parameter
            fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    companies: [company],
                    hideUnknownCompanies: hideUnknownCompanies // Send user preference
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

        return true; // Keep the message channel open until the response is received
    }
});

//TODO: The program saves the setting for a certain page not for all; need to allow toggle button setting changes for all and does not require refreshing the web page