(function () {
    'use strict';

    console.log("🔹 H1B Visa Checker Content Script Loaded");

    let filterEnabled = true;
    let hideUnknown = false;

    // Load saved toggle states from storage
    chrome.storage.sync.get(["filterEnabled", "hideUnknown"], function (data) {
        filterEnabled = data.filterEnabled ?? true;
        hideUnknown = data.hideUnknown ?? false;

        if (filterEnabled) {
            // Begin by auto-scrolling the container until all content is loaded
            autoScrollContainer();
        }
    });

    /**
     * autoScrollContainer
     *
     * Repeatedly scrolls the container (".scaffold-layout__list") until its
     * scrollHeight stops increasing, then calls debugJobListings.
     */
    function autoScrollContainer() {
        const container = document.querySelector(".scaffold-layout__list");
        if (!container) {
            console.warn("⚠️ Job listings container not found.");
            return;
        }
        
        let lastScrollHeight = container.scrollHeight;
        console.log("Initial container scroll height: " + lastScrollHeight);
    
        const scrollInterval = setInterval(() => {
            container.scrollTop = container.scrollHeight;
            console.log("Scrolling container; current scrollTop: " + container.scrollTop);
    
            // Wait a bit for lazy-loaded content to update
            setTimeout(() => {
                const currentScrollHeight = container.scrollHeight;
                console.log("Current container scroll height: " + currentScrollHeight);
                console.log("Number of job cards: " + document.querySelectorAll("li[id]").length);
    
                if (currentScrollHeight > lastScrollHeight) {
                    console.log("New content loaded: previous height = " + lastScrollHeight + ", current height = " + currentScrollHeight);
                    lastScrollHeight = currentScrollHeight;
                } else {
                    console.log("✅ No new content detected. Stopping scroll.");
                    clearInterval(scrollInterval);
                    // Extra wait before processing, just in case
                    setTimeout(() => {
                        debugJobListings();
                    }, 3000); // Increased delay to 3 seconds
                }
            }, 3000); // Increase delay here as well
        }, 3000);  // Increase the interval to 3 seconds between scrolls
    }
    

    /**
     * debugJobListings
     *
     * Extracts company names from all job cards on the page and sends them to the background script for API checking.
     */
    function debugJobListings() {
        if (!filterEnabled) {
            console.log("❌ Filtering is disabled.");
            return;
        }

        console.log("🔍 Extracting job listings...");

        // Select all job cards (li elements with an id) in the document.
        const jobCards = document.querySelectorAll("li[id]");
        if (jobCards.length === 0) {
            console.warn("⚠️ No job listings found. Retrying...");
            setTimeout(debugJobListings, 2000); // Retry after 2 seconds
            return;
        }

        console.log(`✅ Found ${jobCards.length} job cards.`);
        let jobData = [];

        jobCards.forEach((job, index) => {
            const companyElement = job.querySelector("div.artdeco-entity-lockup__subtitle span");
            const jobTitleElement = job.querySelector("div.artdeco-entity-lockup__title a");

            if (companyElement && jobTitleElement) {
                const companyName = companyElement.textContent.trim();
                const jobTitle = jobTitleElement.textContent.trim();

                console.log(`📝 Job ${index + 1}: ${jobTitle} at ${companyName}`);
                jobData.push({
                    company: companyName,
                    jobTitle: jobTitle,
                    jobElement: job // Store reference to the <li> element
                });
            }
        });

        if (jobData.length === 0) {
            console.warn("⚠️ No company names extracted.");
            return;
        }

        // Send the extracted job listings to background.js for API checking
        sendJobListingToBackground(jobData);
    }

    /**
     * sendJobListingToBackground
     *
     * Sends company names (from jobData) to the background script for H1B status checking.
     */
    function sendJobListingToBackground(jobData) {
        if (jobData.length === 0) {
            console.warn("⚠️ No jobs to process.");
            return;
        }

        console.log("📤 Sending job listings to background script...");

        function processNextJob(index) {
            if (index >= jobData.length) {
                console.log("✅ All jobs processed.");
                // After processing, re-run debugJobListings to capture any newly loaded job postings.
                return debugJobListings();
            }

            const job = jobData[index];

            if (!job.jobElement) {
                console.warn(`⚠️ Job element missing for ${job.company}, skipping...`);
                processNextJob(index + 1);
                return;
            }

            console.log(`🔍 Checking job (${index + 1}/${jobData.length}): ${job.jobTitle} at ${job.company}`);

            // Retrieve the "hide unknown companies" setting from storage
            chrome.storage.sync.get(["hideUnknown"], function (data) {
                const hideUnknown = data.hideUnknown ?? false; // Default to false if not set

                chrome.runtime.sendMessage(
                    { 
                        action: "fetchH1BData", 
                        company: job.company,
                        hideUnknown: hideUnknown // Send toggle value to API
                    },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            console.error(`❌ Error sending request for ${job.company}:`, chrome.runtime.lastError);
                            return;
                        }

                        if (response && response.success && response.data[job.company] !== undefined) {
                            if (response.data[job.company] === false) {
                                console.log(`🙈 Hiding job from: ${job.company}`);
                                job.jobElement.style.display = "none";
                            } else {
                                console.log(`👀 Not hiding job from: ${job.company}`);
                            }
                        } else {
                            console.warn(`⚠️ Unexpected API response for ${job.company}. Skipping...`);
                        }

                        console.log(`🚀 Moving to the next job after ${job.company}`);
                        setTimeout(() => processNextJob(index + 1), 500);
                    }
                );
            });
        }

        console.log("🚀 Starting job processing...");
        processNextJob(0);
    }

    // Listen for toggle changes from popup.js
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.action === "toggleFiltering") {
            filterEnabled = request.enabled;
            console.log(`🛑 Filtering toggled: ${filterEnabled ? "ON" : "OFF"}`);
            if (filterEnabled) {
                debugJobListings();
            } else {
                location.reload(); // When turned off, reload the page to show all jobs
            }
        }

        if (request.action === "toggleDatabaseFilter") {
            hideUnknown = request.hide;
            console.log(`🛑 Hide unknown companies: ${hideUnknown}`);
            debugJobListings();
        }

        sendResponse({ success: true });
    });

})();
