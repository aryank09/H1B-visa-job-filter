/**
 * Background Script for H1B FastFilter
 * 
 * Description: This script handles background tasks for the extension, including
 * cache management, message handling, and service worker functionality.
 * 
 * PRE-CONDITIONS: 
 * - The extension must be installed and enabled
 * - Chrome extension APIs must be available
 * - Storage permissions must be granted
 * 
 * POST-CONDITIONS: 
 * - Cache will be initialized and managed
 * - Messages will be processed and routed
 * - Service worker will be registered and active
 * 
 * @author Aryan Khanna
 * @version March 6, 2025
 * 
 * @param none
 * @return none
 */

// Cache configuration
const CACHE_EXPIRY_DAYS = 7;
const MAX_CACHE_ITEMS = 1000;
const CACHE_VERSION = 2; // Add version number

// Service worker self-registration
self.addEventListener('install', async (event) => {
    // Clear cache on install
    try {
        await chrome.storage.local.set({ 
            companyStatusCache: {
                items: {},
                lastCleanup: Date.now(),
                version: CACHE_VERSION
            }
        });
    } catch (error) {
    }
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

/**
 * setupPeriodicCacheCleanup
 * 
 * Description: Sets up periodic cleanup of the extension's cache.
 * 
 * PRE-CONDITIONS: 
 * - Cache configuration constants must be defined
 * - Chrome storage API must be available
 * 
 * POST-CONDITIONS: 
 * - Cache cleanup will be scheduled
 * - Initial cleanup will be performed
 * 
 * @param none
 * @return none
 */
function setupPeriodicCacheCleanup() {
    
    // Initial cleanup
    cleanCache();
    
    // Set up periodic cleanup
    setInterval(async () => {
        await cleanCache();
    }, CACHE_CLEANUP_INTERVAL);
}

// Handle tab updates to ensure content script is ready
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url?.includes('linkedin.com/jobs')) {
        chrome.storage.sync.get(['filterEnabled'], async (data) => {
            try {
                await chrome.tabs.sendMessage(tabId, {
                    action: "initializeState",
                    filterEnabled: data.filterEnabled !== undefined ? data.filterEnabled : true
                });
            } catch (e) {
            }
        });
    }
});

chrome.runtime.onInstalled.addListener(async () => {
    try {
        // Initialize storage with defaults
        const data = await chrome.storage.sync.get(["filterEnabled"]);
        if (data.filterEnabled === undefined) {
            await chrome.storage.sync.set({ filterEnabled: true });
        }

        // Initialize and clean cache
        const cache = await chrome.storage.local.get("companyStatusCache");
        if (!cache.companyStatusCache) {
            await chrome.storage.local.set({ 
                companyStatusCache: {
                    items: {},
                    lastCleanup: Date.now(),
                    version: CACHE_VERSION
                }
            });
        } else {
            await cleanCache();
        }

        // Initialize any existing LinkedIn tabs
        const tabs = await chrome.tabs.query({ url: "*://*.linkedin.com/jobs/*" });
        for (const tab of tabs) {
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    action: "initializeState",
                    filterEnabled: data.filterEnabled !== undefined ? data.filterEnabled : true
                });
            } catch (e) {
            }
        }
    } catch (error) {
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    
    if (message.action === "fetchH1BData") {
        handleH1BDataFetch(message.company, sendResponse);
        return true; // Keep the message channel open for async response
    }

    if (message.action === "toggleFiltering") {
        handleToggleFiltering(message.enabled, sendResponse);
        return true;
    }
});

/**
 * handleH1BDataFetch
 * 
 * Description: Handles requests to fetch H1B data for a company.
 * 
 * PRE-CONDITIONS: 
 * - Company name must be provided
 * - Cache must be initialized
 * - API must be accessible
 * 
 * POST-CONDITIONS: 
 * - Company H1B status will be determined
 * - Cache will be updated
 * - Response will be sent back to content script
 * 
 * @param {string} company - The company name to check
 * @param {Function} sendResponse - Callback function to send response
 * @return none
 */
async function handleH1BDataFetch(company, sendResponse) {
    try {

        
        const cache = await chrome.storage.local.get("companyStatusCache");
        
        // Check cache version and validity
        if (cache.companyStatusCache?.version === CACHE_VERSION && 
            cache.companyStatusCache?.items[company]) {
            const cachedData = cache.companyStatusCache.items[company];
            if (Date.now() - cachedData.timestamp < CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000) {
                sendResponse({ success: true, isH1B: cachedData.isH1B });
                return;
            }
        } else {
        }

        // If not in cache or expired, fetch new data
        const isH1B = await validityChecker(company);
        
        // Update cache
        await updateCache(company, isH1B);
        sendResponse({ success: true, isH1B: isH1B });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

async function handleToggleFiltering(enabled, sendResponse) {
    try {
        await chrome.storage.sync.set({ filterEnabled: enabled });
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
            try {
                await chrome.tabs.sendMessage(tab.id, { 
                    action: "updateFilterState", 
                    enabled: enabled
                });
            } catch (e) {
            }
        }
        sendResponse({ success: true });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * validityChecker
 * 
 * Description: Checks if a company has sponsored H1B visas recently.
 * 
 * PRE-CONDITIONS: 
 * - Company name must be provided
 * - API must be accessible
 * 
 * POST-CONDITIONS: 
 * - Company's H1B sponsorship status will be determined
 * 
 * @param {string} companyName - The company name to check
 * @return {Promise<boolean>} - Whether the company sponsors H1B visas
 */
async function validityChecker(companyName) {
    try {
        
        companyName = companyName.toLowerCase().trim();

        // Check if the company name contains 'amazon' anywhere in it
        if (companyName.includes('amazon')) {
            companyName = "amazon";
        }

        let url;
        if (companyName === "meta") {
            url = "https://h1bdata.info/index.php?em=meta+platforms&year=2024";
        } else if (companyName === "amazon") {
            url = "https://h1bdata.info/index.php?em=amazon+&year=2024";
        } else {
            url = `https://h1bdata.info/index.php?em=${encodeURIComponent(companyName)}&year=2024`;
        }

        const response = await fetch(url);
        
        if (!response.ok) {
            return false;
        }

        const htmlText = await response.text();
        
        // Simple HTML parsing using string operations
        const rows = htmlText.split('<tr>');

        if (rows.length <= 2) {
            return false;
        }

        // Get the first data row (index 2 because 0 is empty and 1 is header)
        const firstDataRow = rows[2];
        
        // Extract cells from the row using a more robust approach
        const cells = [];
        // Use a more greedy pattern to capture all content between td tags
        const cellMatches = firstDataRow.match(/<td[^>]*>[\s\S]*?<\/td>/g);
        
        if (cellMatches) {
            cellMatches.forEach(match => {
                const cellContent = match
                    .replace(/<td[^>]*>/, '')  // Remove opening td tag
                    .replace(/<\/td>$/, '')    // Remove closing td tag
                    .replace(/<[^>]*>/g, '')   // Remove any other HTML tags
                    .trim();
                cells.push(cellContent);
            });
        }


        if (cells.length < 6) { // Changed from 5 to 6 since we expect 6 columns
            return false;
        }

        // cells[4] should be submit date, cells[5] should be start date
        const submitDateStr = cells[4].trim();

        const [month, day, year] = submitDateStr.split('/').map(num => parseInt(num, 10));

        if (!month || !day || !year) {
            return false;
        }

        const submitDate = new Date(year, month - 1, day);
        const today = new Date();
        
        // Calculate absolute difference in days
        const differenceInDays = Math.abs(Math.floor((today - submitDate) / (1000 * 60 * 60 * 24)));

        // Consider it recent if the date is within 365 days
        const isRecent = differenceInDays < 365;
        
        return isRecent;

    } catch (error) {
        return false;
    }
}

/**
 * updateCache
 * 
 * Description: Updates the extension's cache with new company data.
 * 
 * PRE-CONDITIONS: 
 * - Company name and H1B status must be provided
 * - Cache must be initialized
 * 
 * POST-CONDITIONS: 
 * - Cache will be updated with new data
 * - Cache size will be managed
 * 
 * @param {string} company - The company name
 * @param {boolean} isH1B - Whether the company sponsors H1B visas
 * @return {Promise<void>}
 */
async function updateCache(company, isH1B) {
    try {
        const cache = await chrome.storage.local.get("companyStatusCache");
        const currentCache = cache.companyStatusCache || { 
            items: {}, 
            lastCleanup: Date.now(),
            version: CACHE_VERSION
        };
        
        // Add new item
        currentCache.items[company] = {
            isH1B,
            timestamp: Date.now()
        };
        
        // Update version
        currentCache.version = CACHE_VERSION;

        // Clean cache if needed
        if (Object.keys(currentCache.items).length > MAX_CACHE_ITEMS || 
            Date.now() - currentCache.lastCleanup > 24 * 60 * 60 * 1000) {
            await cleanCache();
        } else {
            await chrome.storage.local.set({ companyStatusCache: currentCache });
        }
    } catch (error) {
    }
}

/**
 * cleanCache
 * 
 * Description: Cleans expired items from the extension's cache.
 * 
 * PRE-CONDITIONS: 
 * - Cache must be initialized
 * - Cache configuration must be defined
 * 
 * POST-CONDITIONS: 
 * - Expired items will be removed
 * - Cache size will be maintained within limits
 * 
 * @param none
 * @return {Promise<void>}
 */
async function cleanCache() {
    try {
        const cache = await chrome.storage.local.get("companyStatusCache");
        const currentCache = cache.companyStatusCache || { 
            items: {}, 
            lastCleanup: Date.now(),
            version: CACHE_VERSION
        };
        const expiryTime = Date.now() - (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

        // Remove expired items
        const newItems = {};
        Object.entries(currentCache.items)
            .filter(([_, data]) => data.timestamp > expiryTime)
            .slice(-MAX_CACHE_ITEMS) // Keep only the most recent items if we exceed MAX_CACHE_ITEMS
            .forEach(([company, data]) => {
                newItems[company] = data;
            });

        await chrome.storage.local.set({
            companyStatusCache: {
                items: newItems,
                lastCleanup: Date.now(),
                version: CACHE_VERSION
            }
        });
    } catch (error) {
    }
}
