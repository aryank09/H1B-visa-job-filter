chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchH1BData") {
        const apiUrl = "your server url"; //Flask server URL

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ companies: [request.company] })
        })
        .then(response => response.json())
        .then(data => {
            sendResponse({ success: true, data: data });
        })
        .catch(error => {
            console.error('Error:', error);
            sendResponse({ success: false, error: error });
        });

        return true; //Keep the message channel open for asynchronous response
    }
});
