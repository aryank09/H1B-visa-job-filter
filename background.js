// background.js

// Global in-memory cache for H1B data
let h1bCompanies = {};

// Helper: Get today's date string in YYYY-MM-DD format
function getTodayDateString() {
    return new Date().toISOString().slice(0, 10);
}

// Load persistent cache from chrome.storage.local if valid
chrome.storage.local.get("h1bData", (result) => {
    if (result.h1bData) {
        const cached = result.h1bData;
        const today = getTodayDateString();
        if (cached.date === today) {
            h1bCompanies = cached.data;
            console.log("Loaded persistent H1B cache:", h1bCompanies);
        } else {
            console.log("Cache expired. Clearing persistent cache.");
            chrome.storage.local.remove("h1bData");
            h1bCompanies = {};
        }
    }
});

// Save the current in-memory cache to persistent storage
function saveCache() {
    const cacheData = {
        data: h1bCompanies,
        date: getTodayDateString()
    };
    chrome.storage.local.set({ h1bData: cacheData }, () => {
        console.log("Saved H1B cache to persistent storage.");
    });
}

// Normalize company names and handle aliases
function normalizeCompanyName(company) {
    const lower = company.toLowerCase().trim();
    const amazonEntities = [
        "amazon.com services llc",
        "amazon web services inc",
        "amazon data services inc",
        "amazon.com services inc"
    ];
    if (amazonEntities.includes(lower)) return "amazon";
    if (lower === "meta") return "meta platforms";
    return lower;
}

// Scrape H1B data for a given company
async function scrapeH1BData(company) {
    const normalized = normalizeCompanyName(company);
    let url;
    if (normalized === "meta platforms") {
        url = "https://h1bdata.info/index.php?em=meta+platforms&year=2024";
    } else if (normalized === "amazon") {
        url = "https://h1bdata.info/index.php?em=amazon+&year=2024";
    } else {
        url = "https://h1bdata.info/index.php?em=" + normalized.replace(/\s+/g, '+') + "&year=2024";
    }
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Failed to fetch URL: ${url} (Status: ${response.status})`);
            return null;
        }
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");
        const rows = doc.querySelectorAll("tr");
        if (rows.length > 1) {
            const firstRow = rows[1];
            const cells = firstRow.querySelectorAll("td");
            if (cells.length > 4) {
                const submitDate = cells[4].textContent.trim();
                // Cache the result in memory and persist it
                h1bCompanies[normalized] = submitDate;
                saveCache();
                return submitDate;
            }
        }
        return null;
    } catch (error) {
        console.error("Error scraping H1B data for", normalized, error);
        return null;
    }
}

// Determine if the given submit date is within one year
function isWithinOneYear(submitDateStr) {
    const submitDate = new Date(submitDateStr);
    const today = new Date();
    const diffDays = Math.floor((today - submitDate) / (1000 * 60 * 60 * 24));
    return diffDays < 365;
}

// Main function: Check if a company is an H1B sponsor
// If data is cached, use it; otherwise, scrape the site.
// If no data is found, return the fallback value (hideUnknownCompanies).
async function checkH1BValidity(companyName, hideUnknownCompanies) {
    const normalized = normalizeCompanyName(companyName);
    if (h1bCompanies[normalized] !== undefined) {
        console.log("Using cached data for:", normalized);
        return isWithinOneYear(h1bCompanies[normalized]);
    }
    console.log("Scraping data for:", normalized);
    const submitDate = await scrapeH1BData(companyName);
    if (submitDate) {
        return isWithinOneYear(submitDate);
    } else {
        return hideUnknownCompanies;
    }
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "fetchH1BData") {
        const company = message.company;
        // Retrieve both the extension toggle and hideUnknown toggle from storage
        chrome.storage.sync.get(["extensionEnabled", "hideUnknown"], (data) => {
            const extensionEnabled = data.extensionEnabled ?? true;
            if (!extensionEnabled) {
                console.log("Extension filtering disabled.");
                sendResponse({ success: false, message: "Extension disabled" });
                return;
            }
            const hideUnknownCompanies = data.hideUnknown ?? false;
            checkH1BValidity(company, hideUnknownCompanies).then((isH1BSponsor) => {
                // Return result keyed by company name
                sendResponse({ success: true, data: { [company]: isH1BSponsor } });
            });
        });
        return true; // Keep the message channel open for async response
    }
});


//TODO: The program saves the setting for a certain page not for all; need to allow toggle button setting changes for all and does not require refreshing the web page