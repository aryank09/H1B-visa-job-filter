//finding comapny name
const companyElement = document.querySelector('a[data-test-app-aware-link]');

if (companyElement) {
    const companyName = companyElement.textContent.trim();
    console.log("Company Name:", companyName);

    //sending company name to API_wrapper
    chrome.runtime.sendMessage({ companyName: companyName }, function(response) {
        if (response.hideJob) {
            //If false, hiding job card
            const jobCard = companyElement.closest(".job-card-container");
            if (jobCard) jobCard.style.display = "none";
        }
    });
} else {
    console.error("Company name element not found!");
}
