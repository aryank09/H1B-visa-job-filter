(function () {
    'use strict';

    console.log("🔹 H1B Visa Checker Content Script Loaded");

    let extensionEnabled = true;
    let hideUnknown = false;

    // Load saved toggle states from storage and start filtering if enabled
    chrome.storage.sync.get(["extensionEnabled", "hideUnknown"], (data) => {
        extensionEnabled = data.extensionEnabled ?? true;
        hideUnknown = data.hideUnknown ?? false;
        console.log(`Loaded settings: extensionEnabled = ${extensionEnabled}, hideUnknown = ${hideUnknown}`);
        if (extensionEnabled) {
            autoScrollContainer();
        }
    });

    // Automatically scroll the container to load all job listings
    function autoScrollContainer() {
        const container = document.querySelector(".scaffold-layout__list");
        if (!container) {
            console.warn("⚠️ Job listings container not found.");
            return;
        }
        let lastScrollHeight = container.scrollHeight;
        const scrollInterval = setInterval(() => {
            container.scrollTop = container.scrollHeight;
            setTimeout(() => {
                const currentScrollHeight = container.scrollHeight;
                if (currentScrollHeight > lastScrollHeight) {
                    lastScrollHeight = currentScrollHeight;
                } else {
                    clearInterval(scrollInterval);
                    setTimeout(debugJobListings, 3000);
                }
            }, 3000);
        }, 3000);
    }

    // Extract job listings and send them for H1B validation
    function debugJobListings() {
        if (!extensionEnabled) {
            console.log("Extension filtering disabled.");
            return;
        }
        console.log("🔍 Extracting job listings...");
        const jobCards = document.querySelectorAll("li[id]");
        if (jobCards.length === 0) {
            console.warn("No job listings found. Retrying...");
            setTimeout(debugJobListings, 2000);
            return;
        }
        let jobData = [];
        jobCards.forEach(job => {
            const companyElement = job.querySelector("div.artdeco-entity-lockup__subtitle span");
            const jobTitleElement = job.querySelector("div.artdeco-entity-lockup__title a");
            if (companyElement && jobTitleElement) {
                jobData.push({
                    company: companyElement.textContent.trim(),
                    jobTitle: jobTitleElement.textContent.trim(),
                    jobElement: job
                });
            }
        });
        if (jobData.length > 0) {
            sendJobListingToBackground(jobData);
        }
    }

    // Process job listings in batch using one retrieval of the hideUnknown setting
    function sendJobListingToBackground(jobData) {
        chrome.storage.sync.get("hideUnknown", (data) => {
            const hideUnknownSetting = data.hideUnknown ?? false;
            let index = 0;
            function processNextJob() {
                if (index >= jobData.length) {
                    return debugJobListings();
                }
                const job = jobData[index];
                chrome.runtime.sendMessage({
                    action: "fetchH1BData",
                    company: job.company,
                    hideUnknown: hideUnknownSetting
                }, (response) => {
                    if (response && response.success && response.data[job.company] !== undefined) {
                        if (!response.data[job.company]) {
                            job.jobElement.style.display = "none";
                        } else {
                            job.jobElement.style.display = "";
                        }
                    }
                    index++;
                    // Reduced delay to 100ms for faster processing
                    setTimeout(processNextJob, 100);
                });
            }
            processNextJob();
        });
    }

    // Listen for settings updates from popup (or background)
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "updateSettings") {
            if (request.extensionEnabled !== undefined) {
                extensionEnabled = request.extensionEnabled;
                chrome.storage.sync.set({ extensionEnabled });
                console.log("ExtensionEnabled updated to:", extensionEnabled);
                if (extensionEnabled) {
                    // Immediately start filtering without a page refresh
                    autoScrollContainer();
                } else {
                    // Show all jobs if filtering is disabled
                    document.querySelectorAll("li[id]").forEach(job => job.style.display = "");
                }
            }
            if (request.hideUnknown !== undefined) {
                hideUnknown = request.hideUnknown;
                chrome.storage.sync.set({ hideUnknown });
                console.log("hideUnknown updated to:", hideUnknown);
                if (extensionEnabled) {
                    debugJobListings();
                }
            }
            sendResponse({ success: true });
        }
    });
})();
