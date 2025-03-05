(function () {
    'use strict';

    console.log("🔹 H1B Visa Checker Content Script Loaded");

    let filterEnabled = true;
    let hideUnknown = false;
    let processedJobs = new Set();
    let isInitialized = false;

    // Create status overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background-color: rgba(255, 255, 255, 0.95);
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        font-family: Arial, sans-serif;
        font-size: 14px;
        display: none;
        border: 1px solid #e0e0e0;
        color: #333;
        min-width: 200px;
        text-align: center;
    `;
    document.body.appendChild(overlay);

    // Function to sleep/delay
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Function to start processing
    async function startProcessing() {
        console.log("🔄 Starting job processing with settings:", { filterEnabled });
        if (filterEnabled) {
            await processJobListings();
        }
    }

    // Initialize settings from storage and start processing
    function initialize() {
        chrome.storage.sync.get(["filterEnabled"], (data) => {
            console.log("📥 Loaded storage settings:", data);
            filterEnabled = data.filterEnabled !== undefined ? data.filterEnabled : true;
            isInitialized = true;
            startProcessing();
            setupObservers();
        });
    }

    // Function to check if an element is a job container
    function isJobContainer(node) {
        return node.nodeType === 1 && (
            node.classList?.contains('jobs-search-results-list') ||
            node.classList?.contains('jobs-search-results__list') ||
            node.id === 'main-content'
        );
    }

    // Setup mutation observers
    function setupObservers() {
        // Observer for the job list container
        const jobListObserver = new MutationObserver((mutations) => {
            if (!filterEnabled || !isInitialized) return;

            const shouldProcess = mutations.some(mutation => {
                // Check added nodes
                const hasNewJobs = Array.from(mutation.addedNodes).some(node => 
                    node.nodeType === 1 && node.querySelector('li[id^="ember"]')
                );
                
                // Check if the mutation target itself contains job listings
                const targetHasJobs = mutation.target.querySelector('li[id^="ember"]');
                
                return hasNewJobs || targetHasJobs;
            });

            if (shouldProcess) {
                console.log("🔄 Detected new job listings");
                processJobListings();
            }
        });

        // Observer for the main content area
        const pageObserver = new MutationObserver((mutations) => {
            if (!filterEnabled || !isInitialized) return;

            for (const mutation of mutations) {
                const jobContainers = Array.from(mutation.addedNodes)
                    .filter(node => isJobContainer(node));

                if (jobContainers.length > 0) {
                    console.log("🔍 Found job container, setting up observers");
                    jobContainers.forEach(container => {
                        jobListObserver.observe(container, {
                            childList: true,
                            subtree: true
                        });
                    });
                    processJobListings();
                    break;
                }
            }
        });

        // Start observing the document body for job container
        pageObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Find and observe existing job containers
        const existingContainers = document.querySelectorAll('.jobs-search-results-list, .jobs-search-results__list, #main-content');
        existingContainers.forEach(container => {
            jobListObserver.observe(container, {
                childList: true,
                subtree: true
            });
        });

        // Initial processing if there are already jobs loaded
        if (document.querySelector('li[id^="ember"]')) {
            processJobListings();
        }
    }

    // Reset all job cards to their original state
    function resetJobCards() {
        console.log("🔄 Resetting all job cards to original state");
        // Use a more comprehensive selector to find all job cards
        const jobCards = document.querySelectorAll('li[id^="ember"], .job-card-container, .jobs-search-results__list-item');
        console.log(`Found ${jobCards.length} cards to reset`);
        
        jobCards.forEach(card => {
            try {
                // Remove any existing status indicators
                const status = card.querySelector('.h1b-status');
                if (status) {
                    status.remove();
                }
                
                // Reset all styling completely
                card.style.removeProperty('opacity');
                card.style.removeProperty('display');
                card.style.opacity = '1';
                
                console.log(`Reset card: ${card.id || 'unnamed card'}`);
            } catch (error) {
                console.error('Error resetting card:', error);
            }
        });
        
        // Clear processed jobs set to allow reprocessing when re-enabled
        processedJobs.clear();
        overlay.style.display = 'none';
        console.log("✅ Finished resetting all cards");
    }

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log("📨 Received message:", message);
        
        if (message.action === "initializeState") {
            console.log("🔧 Initializing state with:", message);
            filterEnabled = message.filterEnabled;
            isInitialized = true;
            if (filterEnabled) {
                startProcessing();
            } else {
                resetJobCards();
            }
            setupObservers();
            sendResponse({ success: true });
            return true;
        }

        if (message.action === "updateFilterState") {
            console.log("🔄 Updating filter state:", message.enabled);
            filterEnabled = message.enabled;
            if (filterEnabled) {
                startProcessing();
            } else {
                resetJobCards();
            }
            sendResponse({ success: true });
            return true;
        }

        if (message.action === "updateDatabaseFilter") {
            console.log("🔄 Updating database filter:", message.hide);
            hideUnknown = message.hide;
            if (filterEnabled) {
                processJobListings();
            }
            sendResponse({ success: true });
            return true;
        }
    });

    // Update processJobListings to handle visible jobs only
    async function processJobListings() {
        console.log("🔍 Starting to process visible job listings");
        
        // Get visible job cards
        const jobCards = document.querySelectorAll('li[id^="ember"]');
        
        if (jobCards.length === 0) {
            console.log("⚠️ No job cards found");
            return;
        }

        console.log(`📋 Found ${jobCards.length} job cards to process`);
        overlay.style.display = 'block';
        overlay.textContent = 'Processing visible jobs...';
        
        let processedCount = 0;
        const totalCards = jobCards.length;
        
        for (const card of jobCards) {
            if (processedJobs.has(card.id)) {
                console.log(`Skipping already processed card: ${card.id}`);
                continue;
            }
            
            try {
                processedCount++;
                console.log(`Processing card ${processedCount}/${totalCards}:`, card.id);

                // Try to find company name using the most reliable selector first
                const companyNameElement = 
                    card.querySelector('.job-card-container__company-name') ||
                    card.querySelector('.job-card-container__primary-description') ||
                    card.querySelector('.company-name') ||
                    card.querySelector('.artdeco-entity-lockup__subtitle');

                let companyName = '';
                if (companyNameElement) {
                    companyName = companyNameElement.textContent.trim();
                    console.log(`Found company name using direct selector: "${companyName}"`);
                } else {
                    // Fallback to span search if direct selectors fail
                    const spans = card.querySelectorAll('span');
                    for (const span of spans) {
                        const text = span.textContent.trim();
                        if (!text || 
                            text.includes('ago') || 
                            text.includes('•') || 
                            text.includes('followers') ||
                            text.includes('Promoted') ||
                            text.toLowerCase().includes('intern') ||
                            text.toLowerCase().includes('engineer') ||
                            text.toLowerCase().includes('developer') ||
                            text.includes('(') ||
                            text.length > 50) {
                            continue;
                        }
                        companyName = text;
                        console.log(`Found company name in span: "${companyName}"`);
                        break;
                    }
                }

                if (!companyName) {
                    console.log("⚠️ No valid company name found in card:", card.id);
                    continue;
                }

                processedJobs.add(card.id);
                overlay.innerHTML = `Processing: ${companyName}<br><small>Progress: ${processedCount}/${totalCards} jobs</small>`;
                
                const response = await new Promise(resolve => {
                    chrome.runtime.sendMessage(
                        { action: "fetchH1BData", company: companyName },
                        resolve
                    );
                });

                if (!response.success) {
                    console.error(`❌ Error checking ${companyName}:`, response.error);
                    continue;
                }

                updateJobCard(card, companyName, response.isH1B);
                await sleep(200);

            } catch (error) {
                console.error('❌ Error processing job card:', error);
            }
        }

        overlay.textContent = `✅ Completed processing ${processedCount} jobs`;
        await sleep(2000);
        overlay.style.display = 'none';
    }

    function updateJobCard(card, companyName, isH1B) {
        // Remove any existing status indicators
        const existingStatus = card.querySelector('.h1b-status');
        if (existingStatus) {
            existingStatus.remove();
        }

        // If filtering is disabled, don't add any indicators
        if (!filterEnabled) {
            card.style.removeProperty('opacity');
            card.style.removeProperty('display');
            return;
        }

        // Create status indicator
        const status = document.createElement('div');
        status.className = 'h1b-status';
        status.style.cssText = `
            padding: 4px 8px;
            border-radius: 4px;
            margin: 8px 0;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
        `;

        if (isH1B) {
            status.textContent = '✅ H1B Sponsor';
            status.style.backgroundColor = '#e6f4ea';
            status.style.color = '#137333';
            card.style.opacity = '1';
        } else {
            status.textContent = '❌ No Recent H1B';
            status.style.backgroundColor = '#fce8e6';
            status.style.color = '#c5221f';
            card.style.opacity = '0.5';
        }

        // Try different locations to insert the status
        const insertLocations = [
            '.job-card-container__company-name',
            '.job-card-container__primary-description',
            '.company-name',
            '.job-card-container__company-link',
            '.artdeco-entity-lockup__subtitle'
        ];

        let inserted = false;
        for (const selector of insertLocations) {
            const element = card.querySelector(selector);
            if (element) {
                element.parentNode.insertBefore(status, element.nextSibling);
                inserted = true;
                break;
            }
        }

        if (!inserted) {
            console.log(`⚠️ Could not find insertion point for status in card for ${companyName}`);
            // Fallback: insert at the beginning of the card
            card.insertBefore(status, card.firstChild);
        }
    }

    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
