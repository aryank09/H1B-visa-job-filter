(function () {
    'use strict';

    console.log("🔹 H1B Visa Checker Content Script Loaded");

    let filterEnabled = true;
    let hideUnknown = false;

    // Load saved settings and apply filtering immediately
    chrome.storage.sync.get(["filterEnabled", "hideUnknown"], function (data) {
        filterEnabled = data.filterEnabled ?? true;
        hideUnknown = data.hideUnknown ?? false;

        if (filterEnabled) {
            autoScrollContainer();
        }
    });

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

    function debugJobListings() {
        if (!filterEnabled) return;

        console.log("🔍 Extracting job listings...");
        const jobCards = document.querySelectorAll("li[id]");

        if (jobCards.length === 0) {
            setTimeout(debugJobListings, 2000);
            return;
        }

        let jobData = [];
        jobCards.forEach((job, index) => {
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

    function sendJobListingToBackground(jobData) {
        function processNextJob(index) {
            if (index >= jobData.length) return;

            const job = jobData[index];
            if (!job.jobElement) {
                processNextJob(index + 1);
                return;
            }

            chrome.runtime.sendMessage(
                { action: "fetchH1BData", company: job.company, hideUnknown },
                (response) => {
                    if (chrome.runtime.lastError) {
                        console.error(`❌ Error fetching data for ${job.company}:`, chrome.runtime.lastError);
                        return;
                    }

                    if (response && response.success && response.data[job.company] !== undefined) {
                        if (response.data[job.company] === false) {
                            job.jobElement.style.display = "none";
                        }
                    }
                    setTimeout(() => processNextJob(index + 1), 500);
                }
            );
        }

        processNextJob(0);
    }

    // Listen for global toggle updates from background.js
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "updateFilterState") {
            filterEnabled = request.enabled;
            console.log(`🔄 Filtering toggled: ${filterEnabled ? "ON" : "OFF"}`);

            if (filterEnabled) {
                debugJobListings();
            } else {
                document.querySelectorAll("li[id]").forEach(job => job.style.display = ""); // Show all jobs
            }
        }

        if (request.action === "updateDatabaseFilter") {
            hideUnknown = request.hide;
            console.log(`🔄 Hide unknown companies updated: ${hideUnknown}`);
            debugJobListings();
        }

        sendResponse({ success: true });
    });

})();
