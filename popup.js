document.addEventListener("DOMContentLoaded", function () {
    const toggleFilter = document.getElementById("toggleFilter");
    const statusText = document.createElement("div");
    statusText.id = "status";
    document.body.appendChild(statusText);

    // Load saved states
    chrome.storage.sync.get(["filterEnabled"], function (data) {
        toggleFilter.checked = data.filterEnabled !== undefined ? data.filterEnabled : true;
    });

    // Handle changes for main filter
    toggleFilter.addEventListener("change", function () {
        statusText.textContent = "Updating filter settings...";
        chrome.storage.sync.set({ filterEnabled: toggleFilter.checked }, () => {
            chrome.runtime.sendMessage({ 
                action: "toggleFiltering", 
                enabled: toggleFilter.checked
            }, () => {
                statusText.textContent = `Filtering ${toggleFilter.checked ? 'enabled' : 'disabled'}`;
                setTimeout(() => { statusText.textContent = ''; }, 2000);
            });
        });
    });
});

//TODO: need to add a pop on the screen visible to user all the time and add progress bar for the user to wait