from flask import Flask, render_template, request, jsonify
import json
import os

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('dashboard.html')

@app.route('/api/suburbs')
def api_suburbs():
    sample_path = os.path.join(os.path.dirname(__file__), "sample_data.json")
    with open(sample_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    suburbs = set()
    for prop in data.get("results", []):
        address_block = prop.get("address") or {}
        sal = address_block.get("sal")
        if sal:
            suburbs.add(sal)
    return jsonify(sorted(list(suburbs)))

@app.route('/api/properties')
def api_properties():
    suburb = request.args.get('suburb')
    sample_path = os.path.join(os.path.dirname(__file__), "sample_data.json")
    with open(sample_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    entries = []
    for prop in data.get("results", []):
        address_block = prop.get("address") or {}
        if not address_block or "sal" not in address_block:
            continue
        if address_block.get("sal", "").lower() != suburb.lower():
            continue

        attributes = prop.get("attributes", {})
        coordinates = prop.get("coordinates", {})
        # Robust display: Address
        display_address = prop.get("area_name") or \
            (address_block.get("street", "") + (", " + address_block["sal"] if address_block.get("sal") else "")) or \
            "No address"
        # Robust display: Garage (car spaces)
        garage_spaces = attributes.get("garage_spaces")
        garage_val = garage_spaces if garage_spaces not in [None, "", "None"] else "?"
        # Robust display: Land size
        land_size = attributes.get("land_size")
        land_val = land_size if land_size not in [None, "", "None"] else "?"

        entry = {
            "address": display_address,
            "bathrooms": attributes.get("bathrooms") if attributes.get("bathrooms") not in [None,"","None"] else "?",
            "bedrooms": attributes.get("bedrooms") if attributes.get("bedrooms") not in [None,"","None"] else "?",
            "price": prop.get("price") if prop.get("price") not in [None,"","None"] else "?",
            "garage": garage_val,
            "land_size": land_val,
            "latitude": coordinates.get("latitude"),
            "longitude": coordinates.get("longitude"),
            "description": attributes.get("description", ""),
            "property_type": prop.get("property_type", "")
        }
        entries.append(entry)
    return jsonify(entries)

if __name__ == '__main__':
    app.run(debug=True)
