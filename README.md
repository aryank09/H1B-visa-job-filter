# H1B Visa Checker Chrome Extension

**WORK IN PROGRESS**
## Overview
The **H1B Visa Checker** Chrome extension is a tool designed to assist job seekers in filtering job listings on LinkedIn based on a company's H1B visa application history. The extension checks if a company has applied for an H1B visa in the past year. If a company has not applied for an H1B visa recently, the extension will hide job listings from that company while you browse the LinkedIn job listings.

## Features
- **Visa History Check**: The extension checks if a company has applied for an H1B visa in the past 1 year.
- **Job Listing Filter**: If a company has not applied for an H1B visa, the extension will automatically hide its job listings on LinkedIn.
- **Seamless Experience**: The extension operates in the background, providing a smooth and unobtrusive user experience while browsing LinkedIn job postings.

## How It Works
1. **Extracts Company Name**: The extension identifies the company name listed on each job posting on LinkedIn.
2. **Fetches H1B Visa Data**: Using an external API or database (such as data from the U.S. Department of Labor or a similar source), the extension checks whether the company has applied for an H1B visa in the past year.
3. **Hides Jobs**: If the company has not applied for an H1B visa in the past year, the extension hides the job listing from view.
4. **Displays Remaining Jobs**: Only jobs from companies that have applied for an H1B visa in the past year are shown in the LinkedIn job feed.

## Usage
1. Open LinkedIn and navigate to the **Jobs** section.
2. The extension will automatically check the H1B visa status of companies for all visible job listings.
3. Job listings from companies that have not applied for an H1B visa in the past year will be hidden.
4. You can toggle the extension on and off from the Chrome toolbar.

## Technologies To Be Used (can change)
- **Chrome Extension API**: For building the extension and interacting with LinkedIn pages.
- **JavaScript**: For managing the extension’s logic and interactions.
- **HTML/CSS**: For designing the popup and extension interface.
- **API for H1B Data**: (e.g., Department of Labor H1B data) to check the company’s application history.

## Future Features
- **H1B Visa Application History**: Display additional visa application details (e.g., number of visas applied for, approval rates).
- **Company Profile Insights**: Show more details about the company’s visa history directly in the extension popup.
- **Job Listing Filtering Options**: Allow users to filter jobs by visa sponsorship type.
