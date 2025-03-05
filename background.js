// Cache configuration
const CACHE_EXPIRY_DAYS = 7;
const MAX_CACHE_ITEMS = 1000;
const CACHE_VERSION = 2; // Add version number

// Service worker self-registration
self.addEventListener('install', async (event) => {
    console.log('Service Worker installed');
    // Clear cache on install
    try {
        await chrome.storage.local.set({ 
            companyStatusCache: {
                items: {},
                lastCleanup: Date.now(),
                version: CACHE_VERSION
            }
        });
        console.log('Cache cleared on install');
    } catch (error) {
        console.error('Error clearing cache:', error);
    }
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activated');
    event.waitUntil(clients.claim());
});

// Setup periodic cache cleanup
function setupPeriodicCacheCleanup() {
    console.log('Setting up periodic cache cleanup');
    
    // Initial cleanup
    cleanCache();
    
    // Set up periodic cleanup
    setInterval(async () => {
        console.log('Running scheduled cache cleanup');
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
                console.log(`Tab ${tabId} not yet ready for initialization`);
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
                console.log(`Existing tab ${tab.id} not ready for initialization`);
            }
        }
    } catch (error) {
        console.error("Error during initialization:", error);
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('📨 Received message:', message);
    
    if (message.action === "fetchH1BData") {
        console.log('🎯 Handling fetchH1BData for company:', message.company);
        handleH1BDataFetch(message.company, sendResponse);
        return true; // Keep the message channel open for async response
    }

    if (message.action === "toggleFiltering") {
        handleToggleFiltering(message.enabled, sendResponse);
        return true;
    }
});

async function handleH1BDataFetch(company, sendResponse) {
    try {
        console.log('🚀 handleH1BDataFetch STARTED for company:', company);
        
        const cache = await chrome.storage.local.get("companyStatusCache");
        
        console.log('📦 Cache status:', {
            hasCacheData: !!cache.companyStatusCache,
            companyInCache: !!cache.companyStatusCache?.items[company],
            cacheVersion: cache.companyStatusCache?.version
        });
        
        // Check cache version and validity
        if (cache.companyStatusCache?.version === CACHE_VERSION && 
            cache.companyStatusCache?.items[company]) {
            const cachedData = cache.companyStatusCache.items[company];
            if (Date.now() - cachedData.timestamp < CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000) {
                console.log(`✅ [CACHE] Found valid result for ${company}: ${cachedData.isH1B}`);
                sendResponse({ success: true, isH1B: cachedData.isH1B });
                return;
            }
            console.log('🔄 Cache expired, fetching fresh data');
        } else {
            console.log('🔄 Cache version mismatch or missing, fetching fresh data');
        }

        // If not in cache or expired, fetch new data
        console.log(`🌐 [SCRAPER] Starting validity check for ${company}`);
        const isH1B = await validityChecker(company);
        console.log(`📊 Validity check result for ${company}:`, isH1B);
        
        // Update cache
        console.log('💾 Updating cache with new result');
        await updateCache(company, isH1B);
        
        console.log('✅ Sending response back to content script');
        sendResponse({ success: true, isH1B: isH1B });
    } catch (error) {
        console.error("❌ Error in handleH1BDataFetch:", error);
        console.error('Stack trace:', error.stack);
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
                console.log(`Tab ${tab.id} not ready for message`);
            }
        }
        sendResponse({ success: true });
    } catch (error) {
        console.error("Error toggling filtering:", error);
        sendResponse({ success: false, error: error.message });
    }
}

async function validityChecker(companyName) {
    try {
        console.log('🔍 Starting validity check for company:', companyName);
        
        companyName = companyName.toLowerCase().trim();
        console.log('📝 Normalized company name:', companyName);

        // Check if the company name contains 'amazon' anywhere in it
        if (companyName.includes('amazon')) {
            companyName = "amazon";
            console.log('🔄 Mapped to amazon alias - matched because name contains "amazon"');
        }

        let url;
        if (companyName === "meta") {
            url = "https://h1bdata.info/index.php?em=meta+platforms&year=2024";
        } else if (companyName === "amazon") {
            url = "https://h1bdata.info/index.php?em=amazon+&year=2024";
        } else {
            url = `https://h1bdata.info/index.php?em=${encodeURIComponent(companyName)}&year=2024`;
        }
        console.log('🌐 Fetching URL:', url);

        const response = await fetch(url);
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            console.error("❌ Failed to retrieve the webpage, status:", response.status);
            return false;
        }

        const htmlText = await response.text();
        console.log('📄 Received HTML length:', htmlText.length);
        
        // Simple HTML parsing using string operations
        const rows = htmlText.split('<tr>');
        console.log('📊 Found rows:', rows.length);

        if (rows.length <= 2) {
            console.log(`❌ No data rows found for ${companyName}`);
            return false;
        }

        // Get the first data row (index 2 because 0 is empty and 1 is header)
        const firstDataRow = rows[2];
        console.log('📋 First data row length:', firstDataRow.length);
        
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
                console.log('Found cell content:', cellContent); // Debug log for each cell
            });
        }

        console.log('🔢 All extracted cells:', cells);
        console.log('📱 Number of cells found:', cells.length);

        if (cells.length < 6) { // Changed from 5 to 6 since we expect 6 columns
            console.log(`❌ Invalid row format for ${companyName}. Expected 6 cells but found:`, cells);
            return false;
        }

        // cells[4] should be submit date, cells[5] should be start date
        const submitDateStr = cells[4].trim();
        console.log('📅 Raw submit date:', submitDateStr);

        const [month, day, year] = submitDateStr.split('/').map(num => parseInt(num, 10));
        console.log('📊 Parsed date components:', { month, day, year });

        if (!month || !day || !year) {
            console.log(`❌ Invalid date format for ${companyName}: ${submitDateStr}`);
            return false;
        }

        const submitDate = new Date(year, month - 1, day);
        const today = new Date();
        
        console.log('📅 Submit date object:', submitDate.toISOString());
        console.log('📅 Today date object:', today.toISOString());
        
        // Calculate absolute difference in days
        const differenceInDays = Math.abs(Math.floor((today - submitDate) / (1000 * 60 * 60 * 24)));
        console.log(`⏱️ Absolute date difference: ${differenceInDays} days`);

        // Consider it recent if the date is within 365 days
        const isRecent = differenceInDays < 365;
        console.log(`✨ Final H1B status for ${companyName}: ${isRecent ? 'RECENT ✅' : 'NOT RECENT ❌'}`);
        
        return isRecent;

    } catch (error) {
        console.error(`❌ Error in validityChecker for ${companyName}:`, error);
        console.error('Stack trace:', error.stack);
        return false;
    }
}

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
        console.error("Error updating cache:", error);
    }
}

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
        console.error("Error cleaning cache:", error);
    }
}
