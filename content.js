(function () {
    'use strict';

    console.log("🔹 H1B Visa Checker Content Script Loaded");

    /**
     * debugJobListings method
     * 
     * Description: Extracts company names from LinkedIn job cards and sends them to `background.js`
     */
    function debugJobListings() {
        console.log("🔍 Extracting job listings...");

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

        // Send extracted job listings to `background.js`
        sendJobListingToBackground(jobData);
    }

    /**
     * sendJobListingToBackground method
     * 
     * Description: Sends company names to `background.js` for API checking.
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
                return debugJobListings(); // Re-run to check new job postings
            }

            const job = jobData[index];

            if (!job.jobElement) {
                console.warn(`⚠️ Job element missing for ${job.company}, skipping...`);
                processNextJob(index + 1);
                return;
            }

            console.log(`🔍 Checking job (${index + 1}/${jobData.length}): ${job.jobTitle} at ${job.company}`);

            chrome.runtime.sendMessage(
                { action: "fetchH1BData", company: job.company },
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
        }

        console.log("🚀 Starting job processing...");
        processNextJob(0);
    }

    // Ensure script runs only once on page load
    window.onload = function () {
        debugJobListings();
    };

    // Listen for the popup button click
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.action === "startJobProcessing") {
            debugJobListings();
            sendResponse({ success: true });
        }
    });
})();
