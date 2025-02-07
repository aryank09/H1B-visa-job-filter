document.getElementById("startButton").addEventListener("click", () => {
    //Set the status message to indicate the process has started
    document.getElementById("status").textContent = "Starting program... \nPlease refresh the website";

    //Send a message to the background script to trigger the function for checking job listings
    chrome.runtime.sendMessage({ action: "startJobChecker" }, (response) => {
        if (response.success)
            {
            document.getElementById("status").textContent = "Program started successfully.";
        }
        else
        {
            document.getElementById("status").textContent = "Error: " + response.error;
        }
    });
});
