// ==UserScript==
// @name         LinkedIn H1B Job Filter 
// @namespace    http://tampermonkey.net/
// @version      0.1.9.9
// @description  LinkedIn job scraping for H1B filter.
// @match        https://www.linkedin.com/jobs/*
// @grant        GM_xmlhttpRequest
// @connect      localhost
// @connect      127.0.0.1
// @connect      jsonplaceholder.typicode.com
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const apiUrl = "http://127.0.0.1:5000/scrape"; // Flask API

    function debugJobListings() {
        console.log("🔍 Extracting job listings...");

        // Find job cards (li elements with an id)
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
                    jobElement: job // Store the reference to the <li> element
                });
            }
        });

        if (jobData.length === 0) {
            console.warn("⚠️ No company names extracted.");
            return;
        }

        // Send extracted job listings to API
        sendJobListingToAPI(jobData);
    }

    function sendJobListingToAPI(jobData) {
        if (jobData.length === 0) {
            console.warn("⚠️ No jobs to process.");
            return;
        }

        console.log("📤 Sending job listings to API...");

        function processNextJob(index) {
            if (index >= jobData.length) {
                console.log("✅ All jobs processed.");
                return debugJobListings();
            }

            const job = jobData[index];

            if (!job.jobElement) {
                console.warn(`⚠️ Job element missing for ${job.company}, skipping...`);
                processNextJob(index + 1);
                return;
            }

            console.log(`🔍 Checking job (${index + 1}/${jobData.length}): ${job.jobTitle} at ${job.company}`);

            const requestData = JSON.stringify({ companies: [job.company] });

            GM_xmlhttpRequest({
                method: "POST",
                url: apiUrl,
                headers: { "Content-Type": "application/json" },
                data: requestData,
                onload: function (response) {
                    console.log(`📬 Raw API Response for ${job.company}:`, response);
                    if (response.status === 200) {
                        try {
                            const result = JSON.parse(response.responseText);
                            console.log(`📬 Parsed API Response for ${job.company}:`, result);

                            // Check for valid response data
                            if (result[job.company] === undefined) {
                                console.warn(`⚠️ Unexpected API response for ${job.company}. Skipping...`);
                                setTimeout(() => processNextJob(index + 1), 500);
                                return;
                            }

                            if (result[job.company] === false) {
                                console.log(`🙈 Hiding job from: ${job.company}`);
                                job.jobElement.style.display = "none"; // Hide the job
                            } else {
                                console.log(`👀 Not hiding job from: ${job.company}`);
                            }
                        } catch (e) {
                            console.error(`❌ JSON Parsing Error for ${job.company}:`, e, response.responseText);
                        }
                    } else {
                        console.error(`❌ API Error for ${job.company}:`, response.status, response.responseText);
                    }

                    // Log before moving to the next job
                    console.log(`🚀 Moving to the next job after ${job.company}`);
                    setTimeout(() => processNextJob(index + 1), 500);
                },
                onerror: function (error) {
                    console.error(`❌ Request failed for ${job.company}:`, error);
                    setTimeout(() => processNextJob(index + 1), 1000); // Retry next job after delay
                }
            });
        }

        console.log("🚀 Starting job processing...");
        processNextJob(0);
    }

    // Ensure script runs only once on page load
    window.onload = function() {
        debugJobListings();
    };
})();
