import requests
from bs4 import BeautifulSoup
from datetime import datetime

#url in the form of https://h1bdata.info/index.php?em=(company_name_goes_here)&job=&city=&year=2024
#for now we will use amazon as dummy url

def validity_checker(url):
    url = "https://h1bdata.info/index.php?em=amazon+&year=2024"

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