#API_wrapper.py
#
#Description: This program wraps the h1b_check.py into an API fromat using Flask to allow the program to be used as an API
#
#@author Aryan Khanna
#@version Feb 6, 2024

#importing required modules
from flask import Flask, request, jsonify
from flask_cors import CORS
import h1b_check as h1b

app = Flask(__name__)
CORS(app)

company_cache = {} #hashmap to store company name and boolean value to make the program faster

@app.route('/scrape', methods=['POST'])
def scrape():
    # getting company names and user preference
    data = request.json
    company_names = data.get("companies", [])
    hide_unknown = data.get("hideUnknownCompanies", False)  # Default to False if not provided

    if not company_names:
        return jsonify({"error": "No company names provided"}), 400

    results = {}
    
    for company in company_names:
        # Check if the company is already in the cache
        if company in company_cache:
            print(f"🔍 Using cached result for {company}")
            results[company] = company_cache[company]
        else:
            # If not in the cache, call the API and store the result
            print(f"🔄 Calling API for {company}")
            result = h1b.validity_checker(company, hide_unknown)
            company_cache[company] = result  # Cache the result
            results[company] = result

    return jsonify(results)

# running local server
if __name__ == "__main__":
    app.run(port=5000)