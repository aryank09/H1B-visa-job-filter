from flask import Flask, request, jsonify
import h1b_check as h1b

app = Flask(__name__)

@app.route('/scrape', methods=['POST'])
def scrape():
    data = request.json
    company_names = data.get("companies", [])

    if not company_names:
        return jsonify({"error": "No company names provided"}), 400

    #Checking H1B sponsorship for each company
    results = {company: h1b.validity_checker(company) for company in company_names}

    return jsonify(results)

if __name__ == "__main__":
    app.run(port=5000)
