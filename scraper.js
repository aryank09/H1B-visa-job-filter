async function validityChecker(companyName, hideUnknownCompany) {
    // List of Amazon-related names that should be treated as "Amazon"
    const amazonEntities = [
        "Amazon.com Services LLC",
        "Amazon Web Services Inc",
        "Amazon Data Services Inc",
        "Amazon.com Services Inc"
    ];

    companyName = companyName.toLowerCase();

    if (amazonEntities.map(name => name.toLowerCase()).includes(companyName)) {
        companyName = "amazon";
    }

    console.log(companyName);

    let url;
    if (companyName === "meta") {
        url = "https://h1bdata.info/index.php?em=meta+platforms&year=2024";
    } else if (companyName === "amazon") {
        url = "https://h1bdata.info/index.php?em=amazon+&year=2024";
    } else {
        url = `https://h1bdata.info/index.php?em=${encodeURIComponent(companyName)}&year=2024`;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error("Failed to retrieve the webpage, status:", response.status);
            return hideUnknownCompany;
        }

        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");

        const rows = doc.querySelectorAll("tr");

        if (rows.length > 1) {
            const firstRow = rows[1];
            const cells = firstRow.querySelectorAll("td");
            if (cells.length >= 5) {
                var submitDate = cells[4].textContent.trim(); // Index 4 for the submission date
            } else {
                console.log("Invalid row format.");
                return hideUnknownCompany;
            }
        } else {
            console.log("No data rows found.");
            return hideUnknownCompany;
        }

        // Get today's date
        const today = new Date();
        const todayFormatted = `${(today.getMonth() + 1).toString().padStart(2, "0")}/${today.getDate().toString().padStart(2, "0")}/${today.getFullYear()}`;

        const dateDifference = (date1, date2) => {
            const d1 = new Date(date1);
            const d2 = new Date(date2);
            return Math.abs((d1 - d2) / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
        };

        const difference = dateDifference(todayFormatted, submitDate);

        console.log(difference);
        return difference < 365;

    } catch (error) {
        console.error("An error occurred:", error);
        return hideUnknownCompany;
    }
}

if (typeof module !== "undefined") {
    module.exports = { validityChecker };
}