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

#TODO: Need to figure out a way to keep hashmap in use for the entire session, instead of starting again

#to ensure gone under one name because issue with link 
amazon_entities = [
        "Amazon.com Services LLC",
        "Amazon Web Services Inc",
        "Amazon Data Services Inc",
        "Amazon.com Services Inc"
    ]

#hashmap containing company names and boolean value for faster removal
checked_companies = {}

#validity_check method
#
#Description: This method checks wether the company exists within the h1b database, if it does it returns true if the company has applied for a h1b visa in the past 1 year, else false
#
#PRE-CONDITIONS: The method should recieve company name
#
#POST-CONSITIONS: The returns True or false, (if company does not exist within the database it still returns true)
#
#@params company_name is a str
#@return boolean, may be True or False
def validity_checker(company_name, hideUnkownCompany):

    company_name = company_name.lower()

    if company_name in amazon_entities:
         company_name = "amazon"
    
    if company_name in checked_companies:
         return checked_companies.get(company_name)

    print(company_name)
    if (company_name == "meta"):
         url = "https://h1bdata.info/index.php?em=meta+platforms&year=2024"
    elif(company_name == "amazon"):
         url = "https://h1bdata.info/index.php?em=amazon+&year=2024"
    else:
        base_url = "https://h1bdata.info/index.php?em="
        url = f"{base_url}{company_name.replace(' ', '+')}&year=2024"

    
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
        return hideUnkownCompany

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
        checked_companies[company_name] = True
        return True
    else:
        print(difference)
        checked_companies[company_name] = False
        return False

