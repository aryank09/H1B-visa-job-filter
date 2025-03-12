# H1B FastFilter Chrome Extension

## Overview
The **H1B FastFilter** Chrome extension helps job seekers efficiently filter LinkedIn job listings based on companies' H1B visa sponsorship history. It automatically checks each company's recent H1B visa application history and provides clear visual indicators for sponsorship status. The extension processes jobs in real-time as you browse, making your job search more efficient.

## Features
- **Real-Time H1B Status**: Instantly checks and displays H1B sponsorship status for each company
- **Visual Indicators**: Clear color-coded labels showing sponsorship status
- **Progress Tracking**: Shows processing status and statistics in real-time
- **Automatic Processing**: Works automatically as you browse job listings
- **Smart Caching**: Remembers previously checked companies for faster results
- **Toggle Control**: Easy enable/disable functionality through the popup interface

## How It Works
1. **Job Detection**: Automatically detects job listings as you browse LinkedIn
2. **Company Analysis**: Extracts and verifies company names from job listings
3. **H1B Verification**: Checks each company's H1B visa sponsorship history
4. **Visual Feedback**: 
   - ✅ Green label for companies with recent H1B sponsorship
   - ❌ Red label for companies without recent sponsorship
5. **Statistics Tracking**: Maintains count of processed jobs and sponsoring companies

## Installation
1. **Download**: Clone or download this repository
2. **Install in Chrome**:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the extension directory

## Usage
1. **Enable the Extension**:
   - Click the extension icon in Chrome toolbar
   - Use the toggle switch to enable/disable filtering

2. **Browse LinkedIn Jobs**:
   - Navigate to LinkedIn jobs page
   - Scroll through listings normally
   - Watch real-time processing in top-right corner
   - View sponsorship status next to company names

3. **View Statistics**:
   - Open extension popup to see:
     - Total jobs processed
     - Number of H1B sponsors found

## Technical Details

### Components
1. **Content Script (`content.js`)**:
   - Processes LinkedIn job listings
   - Manages visual indicators
   - Handles real-time updates
   - Maintains processing statistics

2. **Background Script (`background.js`)**:
   - Manages data caching
   - Handles H1B data verification
   - Controls cross-origin requests
   - Maintains extension state

3. **Popup Interface (`popup.js`, `popup.html`)**:
   - Provides user controls
   - Displays statistics
   - Manages extension settings

4. **CORS Rules (`rules.json`)**:
   - Manages cross-origin requests
   - Handles API access permissions

### Permissions
- `activeTab`: For accessing LinkedIn pages
- `storage`: For caching and settings
- `scripting`: For content script injection
- `declarativeNetRequest`: For CORS handling
- Host permissions for LinkedIn and H1B data access

## Troubleshooting
- If extension stops working, refresh the LinkedIn page
- Clear extension cache if results seem outdated
- Ensure you're on LinkedIn jobs pages
- Check if the extension is enabled

## Privacy & Data
- No personal data is collected
- Company names are only used for H1B verification
- Cache data is stored locally
- No external data sharing

## Version
Current Version: 1.0
Last Updated: March 2024

## Support
For issues or suggestions:
1. Check troubleshooting steps
2. Refresh the page if needed
3. Clear extension cache
4. Report issues via GitHub

## Future Enhancements
- **User-Controlled Filters**: Allow users to set custom filtering criteria.
- **Date-Based Filtering**: Enable users to specify how far back to check visa applications.
- **Full Chrome Web Store Release**: Publish the extension for easy installation.

---
