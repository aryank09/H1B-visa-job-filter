#h1b_check.py
#
#Description: This program scrapes h1b databse to check wether the given company name has applied for a h1b visa in the past 1 year
#
#@author Aryan Khanna
#@version Feb 6, 2024

#importing necessary modules
import requests
from bs4 import BeautifulSoup
from datetime import datetime

#url in the form of https://h1bdata.info/index.php?em=(company_name_goes_here)&job=&city=&year=2024
#for now we will use amazon as dummy url

#to ensure gone under one name because issue with link 
amazon_entities = [
        "Amazon.com Services LLC",
        "Amazon Web Services Inc",
        "Amazon Data Services Inc",
        "Amazon.com Services Inc"
    ]

#validity_check method
#
#Description: This method checks wether the company exists within the h1b database, if it does it returns true if the company has applied for a h1b visa in the past 1 year, else false
#
#PRE-CONDITIONS: The method should recieve company name
#
#POST-CONSITIONS: The returns True or false, (if comapny does not exist within the database it still returns true)
#
#@params company_name is a str
#@return boolean, may be True or False
def validity_checker(company_name):
    print(company_name.lower())
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
        return True

    #getting date in the required format
    today = datetime.today()
    today = today.strftime("%m/%d/%Y")

    date_format = "%m/%d/%Y"
    d1 = datetime.strptime(today, date_format)
    d2 = datetime.strptime(submit_date, date_format)

    difference = abs((d1 - d2).days)

    if difference < 365:
        #if applied less than 1 year
        print(difference)
        return True
    else:
        print(difference)
        return False

