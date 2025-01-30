from flask import Flask, request, jsonify
import h1b_check as h1b

app = Flask(__name__)

@app.route('/scrape', methods=['GET'])
def scrape():
    job_url = request.args.get('url')  

    if not job_url:
        return jsonify({"error": "Missing job URL"}), 400

    company_name = h1b.company_name_scraper(job_url)
    
    if not company_name or company_name == "No company name found.":
        return jsonify({"error": "Could not extract company name"}), 400

    h1b_status = h1b.validity_checker(company_name)

    return jsonify({"company_name": company_name, "hasH1B": h1b_status})

if __name__ == "__main__":
    app.run(port=5000)