from flask import Flask, request, jsonify
import h1b_check as h1b

app = Flask(__name__)

@app.route('/scrape', methods=['GET'])
def scrape():
    company = request.args.get('company')
    if not company:
        return jsonify({"error": "Missing company name"}), 400

    result = h1b.validity_checker(company)
    return jsonify({"hasH1B": result})

if __name__ == "__main__":
    app.run(port=5000)