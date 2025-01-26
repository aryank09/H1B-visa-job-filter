document.addEventListener("DOMContentLoaded", () => {
    const toggleFilter = document.getElementById("toggle-filter");
    const applyFilter = document.getElementById("apply-filter");
    const statusMessage = document.getElementById("status-message");

    toggleFilter.addEventListener("change", () => {
        const isEnabled = toggleFilter.checked;
        chrome.runtime.sendMessage({ action: "toggleFilter", enabled: isEnabled });
        statusMessage.textContent = isEnabled
            ? "Filtering is enabled."
            : "Filtering is disabled.";
    });

    applyFilter.addEventListener("click", () => {
        chrome.runtime.sendMessage({ action: "applyFilter" });
        statusMessage.textContent = "Filtering applied!";
    });
});
