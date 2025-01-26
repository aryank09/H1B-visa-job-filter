chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.companyName) {
        //sending company name to the scraper API
        fetch("http://127.0.0.1:5000/check_company", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ company_name: request.companyName })
        })
        .then(response => response.json())
        .then(data => {
            console.log("API Response:", data);
            sendResponse({ hideJob: !data.isValid });
        })
        .catch(error => {
            console.error("Error communicating with the API:", error);
            sendResponse({ hideJob: false }); // Default to not hiding on error
        });

        return true; // Keep the message channel open for async response
    }
});
