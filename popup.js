// popup.js
document.addEventListener("DOMContentLoaded", () => {
    const toggleSwitch = document.getElementById("toggleExtension");
    const hideUnknownSwitch = document.getElementById("hideUnknown");

    // Load saved settings from storage and update UI controls
    chrome.storage.sync.get(["extensionEnabled", "hideUnknown"], (data) => {
        toggleSwitch.checked = data.extensionEnabled ?? true;
        hideUnknownSwitch.checked = data.hideUnknown ?? false;
    });

    // When the extension toggle changes, update storage and notify content script
    toggleSwitch.addEventListener("change", () => {
        const enabled = toggleSwitch.checked;
        chrome.storage.sync.set({ extensionEnabled: enabled }, () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]?.id) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "updateSettings", extensionEnabled: enabled });
                }
            });
        });
    });

    // When the "hide unknown companies" toggle changes, update storage and notify content script
    hideUnknownSwitch.addEventListener("change", () => {
        const hide = hideUnknownSwitch.checked;
        chrome.storage.sync.set({ hideUnknown: hide }, () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]?.id) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "updateSettings", hideUnknown: hide });
                }
            });
        });
    });
});


//TODO: need to add a pop on the screen visible to user all the time and add progress bar for the user to wait