# H1B Visa Checker Tampermonkey Script

## Overview
The H1B Visa Checker Tampermonkey script is a tool designed to assist job seekers in filtering job listings on LinkedIn based on a company's H1B visa application history. The script checks if a company has applied for an H1B visa in the past year. If a company has not applied for an H1B visa recently, the script will hide job listings from that company while you browse LinkedIn job postings.

The script is powered by a Python backend that scrapes company names and checks them against the H1B visa databases using an API wrapper. The backend is responsible for gathering and validating H1B visa data, while the Tampermonkey script interacts with LinkedIn job postings.

## Features
- **Visa History Check:** The script checks if a company has applied for an H1B visa in the past year.
- **Job Listing Filter:** If a company has not applied for an H1B visa, the script will automatically hide its job listings on LinkedIn.
- **Seamless Experience:** The script operates in the background, providing a smooth and unobtrusive user experience while browsing LinkedIn job postings.
- **Job Listing Auto-Detection:** The script automatically detects new job listings as they appear, ensuring all relevant jobs are filtered.
- **Backend Scraping:** A Python program scrapes company names and checks them against the H1B visa databases.
- **API Wrapper:** The Python backend provides an API wrapper that communicates with the Tampermonkey script for seamless integration.

## How It Works
1. **Backend Scraping (Python Program):**
   - A Python program scrapes job listings from LinkedIn to extract company names.
   - The program then checks the scraped company names against the H1B visa application database.
   - The Python backend uses an API wrapper to interact with the H1B visa database and validate the company’s visa application history.
   
2. **Tampermonkey Script:**
   - The Tampermonkey script extracts company names from LinkedIn job postings.
   - It then sends the company names to the backend API for checking their H1B visa status.
   - If a company has not applied for an H1B visa recently, the script hides the job listing from view.
   - Only jobs from companies that have applied for an H1B visa in the past year are shown in the LinkedIn job feed.
   
3. **Detection of jobs:** 
   - The script re-runs to check newly added jobs and rechecks their H1B visa status to ensure the listings are up to date.

## Usage
1. **Install Tampermonkey:** Install the Tampermonkey browser extension.
2. **Install Script:**
   - Open the Tampermonkey dashboard.
   - Create a new script and paste the provided code.
3. **Run Backend:**
   - Set up and run the Python program to scrape company names and interact with the H1B visa database API.
4. **Navigate to LinkedIn Jobs:** Visit the LinkedIn jobs section.
5. The script will automatically check the H1B visa status of companies for all visible job listings.
6. Job listings from companies that have not applied for an H1B visa in the past year will be hidden.
7. You can toggle the script on and off from the Tampermonkey dashboard.

## Technologies Used
- **Tampermonkey:** For managing and running the script.
- **JavaScript:** For managing the script’s logic and interactions with LinkedIn job listings.
- **Python (Backend):** For scraping company names and interacting with the H1B visa database API.
- **API Wrapper:** For checking the H1B visa application status of companies using external data sources.

## Future Features
- **Chrome Extension:** Making this program into a chrome extension 
- **Date since last applied scroll:** Allowing users to adjust the dates since last applied 
