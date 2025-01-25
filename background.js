chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "checkH1B") {
        const companyName = message.companyName;

        console.log("Received request to check H1B status for:", companyName);

        
        const hasApplied = Math.random() > 0.5; 

        
        sendResponse({ applied: hasApplied });
    }

    return true; 
});
