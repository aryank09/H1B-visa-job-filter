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
    function startProcessing() {
        console.log("🔄 Starting job processing with settings:", { filterEnabled, hideUnknown });
        if (filterEnabled) {
            processJobListings();
        }
    }

    // Initialize settings from storage and start processing
    function initialize() {
        chrome.storage.sync.get(["filterEnabled", "hideUnknown"], (data) => {
            console.log("📥 Loaded storage settings:", data);
            filterEnabled = data.filterEnabled !== undefined ? data.filterEnabled : true;
            hideUnknown = data.hideUnknown !== undefined ? data.hideUnknown : false;
            isInitialized = true;
            startProcessing();
        });
    }

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log("📨 Received message:", message);
        
        if (message.action === "initializeState") {
            console.log("🔧 Initializing state with:", message);
            filterEnabled = message.filterEnabled;
            hideUnknown = message.hideUnknown;
            isInitialized = true;
            startProcessing();
            sendResponse({ success: true });
            return true;
        }

        if (message.action === "updateFilterState") {
            console.log("🔄 Updating filter state:", message.enabled);
            filterEnabled = message.enabled;
            if (filterEnabled) {
                processJobListings();
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

    // Reset all job cards to their original state
    function resetJobCards() {
        const jobCards = document.querySelectorAll('.job-card-container, .jobs-search-results__list-item');
        jobCards.forEach(card => {
            card.style.opacity = '1';
            card.style.display = '';
            const status = card.querySelector('.h1b-status');
            if (status) {
                status.remove();
            }
        });
        processedJobs.clear();
        overlay.style.display = 'none';
    }

    // Observer for dynamic content
    const observer = new MutationObserver((mutations) => {
        if (filterEnabled && isInitialized) {
            const hasNewJobs = mutations.some(mutation => 
                Array.from(mutation.addedNodes).some(node => 
                    node.nodeType === 1 && 
                    (node.classList?.contains('job-card-container') || 
                     node.classList?.contains('jobs-search-results__list-item'))
                )
            );
            
            if (hasNewJobs) {
                processJobListings();
            }
        }
    });

    async function processJobListings() {
        console.log("🔍 Starting to process job listings");
        
        // Use the li[id^="ember"] selector to get job cards
        const jobCards = document.querySelectorAll('li[id^="ember"]');
        
        if (jobCards.length === 0) {
            console.log("⚠️ No job cards found");
            return;
        }

        console.log(`📋 Found ${jobCards.length} job cards`);
        overlay.style.display = 'block';
        overlay.textContent = 'Starting to process job listings...';
        
        let processedCount = 0;
        const totalCards = jobCards.length;
        
        for (const card of jobCards) {
            if (processedJobs.has(card)) continue;
            
            try {
                processedCount++;
                // Log the card ID for debugging
                console.log("Processing card:", card.id);

                // Get all spans in the card and log them for debugging
                const spans = card.querySelectorAll('span');
                console.log(`Found ${spans.length} spans in card`);
                
                let companyName = '';
                
                // Look through spans for company name
                for (const span of spans) {
                    const text = span.textContent.trim();
                    console.log(`Checking span with class "${span.className}":`, text);
                    
                    // Skip if empty or looks like metadata
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
                    console.log(`Found potential company name: "${companyName}" in span with class:`, span.className);
                    break;
                }

                if (!companyName) {
                    console.log("⚠️ No valid company name found in card:", card.id);
                    continue;
                }

                console.log(`🏢 Using company name: "${companyName}" from card:`, card.id);
                
                processedJobs.add(card);
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

                console.log(`✅ Result for ${companyName}:`, response.isH1B);
                updateJobCard(card, companyName, response.isH1B);

                // Add a delay between processing each card
                await sleep(300); // 300ms delay

            } catch (error) {
                console.error('❌ Error processing job card:', error);
                console.error('Stack:', error.stack);
            }
        }

        // Keep the final status visible for a moment before hiding
        overlay.textContent = `✅ Completed processing ${processedCount} jobs`;
        await sleep(2000);
        overlay.style.display = 'none';
        console.log("✅ Finished processing job listings");
    }

    function updateJobCard(card, companyName, isH1B) {
        // Remove any existing status indicators
        const existingStatus = card.querySelector('.h1b-status');
        if (existingStatus) {
            existingStatus.remove();
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
            if (hideUnknown) {
                card.style.display = 'none';
            } else {
                card.style.opacity = '0.5';
            }
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

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();
