# H1B Visa Checker Chrome Extension (WORK IN PROGRESS)

## Overview
The **H1B Visa Checker** Chrome extension helps job seekers filter job listings on LinkedIn based on a company's H1B visa application history. It checks whether a company has applied for an H1B visa in the past year and hides job postings from companies that have not. Companies missing from the H1B database are filtered, a toogle option is present to not filter them.

The extension uses a **JavaScript-based content script** to extract job listings dynamically, while an **API** verifies companies' visa history. I have built a custom API that fetches and processes H1B visa application data, ensuring that even job postings requiring scrolling are accurately checked.

---

## Features
- **Visa History Check**: Determines if a company has applied for an H1B visa in the past year.
- **Job Listing Filtering**: Hides job postings from companies that have not recently applied for an H1B visa.
- **Seamless Experience**: The extension works in the background without disrupting the browsing experience.
- **Auto-Detection of Listings**: Continuously scans for new job postings as you scroll.

---

## How It Works
### **Chrome Extension**
1. **Content Script**: Extracts company names from LinkedIn job postings.
2. **API Call**: Sends company names to an external API for visa application verification.
3. **Filtering Logic**: Hides job listings from companies that have not recently applied for an H1B visa.
4. **Scrolling Mechanism**: Automatically scrolls through the job feed to detect and process all listings.

---

## Installation
1. **Download the Extension Files**: Clone or download the repository.
2. **Load as an Unpacked Extension**:
   - Open **Chrome** and go to `chrome://extensions/`.
   - Enable **Developer mode** (top right corner).
   - Click **Load unpacked** and select the extension folder.
3. **Enable and Use**: Visit LinkedIn Jobs and the extension will filter listings automatically.

---

## Technologies Used
- **JavaScript**: Core scripting for job extraction and filtering.
- **Chrome Extensions API**: Manages extension permissions and interactions.
- **API Integration**: Fetches H1B visa data for validation.

---

## Future Enhancements
- **User-Controlled Filters**: Allow users to set custom filtering criteria.
- **Date-Based Filtering**: Enable users to specify how far back to check visa applications.
- **Full Chrome Web Store Release**: Publish the extension for easy installation.

---
