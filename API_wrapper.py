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

@app.route('/scrape', methods=['POST'])
def scrape():
    #getting company names
    data = request.json
    company_names = data.get("companies", [])

    if not company_names:
        return jsonify({"error": "No company names provided"}), 400

    #Checking H1B sponsorship for each company
    results = {company: h1b.validity_checker(company) for company in company_names}

    return jsonify(results)

#running local server
if __name__ == "__main__":
    app.run(port=5000)
