const apiUrl = "your server address"; // Add your Flask API URL here

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "fetchH1BData") {
        const company = message.company;

        // Send request to Flask API
        fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ companies: [company] })
        })
        .then(response => response.json())
        .then(data => {
            sendResponse({ success: true, data: data });
        })
        .catch(error => {
            console.error("API Request failed:", error);
            sendResponse({ success: false });
        });

        // Keep the message channel open until the response is received
        return true;
    }
});
