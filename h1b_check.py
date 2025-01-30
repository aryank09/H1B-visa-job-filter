import requests
from bs4 import BeautifulSoup
from datetime import datetime

#url in the form of https://h1bdata.info/index.php?em=(company_name_goes_here)&job=&city=&year=2024
#for now we will use amazon as dummy url

amazon_entities = [
        "Amazon.com Services LLC",
        "Amazon Web Services Inc",
        "Amazon Data Services Inc",
        "Amazon.com Services Inc"
    ]

def validity_checker(company_name):
    print("here", company_name.lower())
    if (company_name.lower() == "meta"):
         url = "https://h1bdata.info/index.php?em=meta+platforms&year=2024"
    elif(company_name.lower() == "amazon" or company_name.lower() in amazon_entities):
         url = "https://h1bdata.info/index.php?em=amazon+&year=2024"
    else:
        base_url = "https://h1bdata.info/index.php?em="
        company_name = company_name.lower()
        url = f"{base_url}{company_name.replace(' ', '+')}&year=2024"

    #url = "https://h1bdata.info/index.php?em=amazon+&year=2024"
    
    response = requests.get(url)
    if response.status_code != 200:
            print(response.status_code)
            print("Failed to retrieve the webpage.")

    soup = BeautifulSoup(response.text, 'html.parser')
    rows = soup.select("tr")

    if len(rows) > 1:  
        first_row = rows[1]  
        cells = first_row.find_all("td")
        submit_date = cells[4].get_text(strip=True) #using 4 index since submit date is in the index 4 position
    else:
        print("No data rows found.")
        return None


    today = datetime.today()
    today = today.strftime("%m/%d/%Y")

    date_format = "%m/%d/%Y"
    d1 = datetime.strptime(today, date_format)
    d2 = datetime.strptime(submit_date, date_format)

    difference = abs((d1 - d2).days)

    if difference < 365:
        #if applied less than 1 year
        return True
    else:
        return False


def company_name_scraper(url):
    response = requests.get(url)
    if response.status_code != 200:
        print(response.status_code)
        print("Failed to retrieve the webpage.")
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    #The commented out code is for all the job listing on one page
    # company_names = [a.get_text(strip=True) for a in soup.select("a.hidden-nested-link")]

    # clean_company_names = [name for name in company_names if name != "******"]

    # print(clean_company_names)

    first_company = soup.select_one("a.hidden-nested-link")

    if first_company:
        company_name = first_company.get_text(strip=True)
        return company_name
    else:
        return "No company name found."