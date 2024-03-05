import json
from collections import defaultdict

def start():
    pairings_data = None
    with open('/formatted/ingredient-pairs.json', 'r', encoding='utf-8') as file:
        pairings_data = json.loads(file.read())

    # Convert pairings data into a more accessible structure for recommendations
    # Create a dictionary to hold ingredient pairings and counts
    pairings = defaultdict(lambda: defaultdict(int))
    for pairing in pairings_data:
        pairings[pairing["ing1"]][pairing["ing2"]] += pairing["count"]
        pairings[pairing["ing2"]][pairing["ing1"]] += pairing["count"]

    with open('/formatted/ingredient-recomendation-matrix.json', 'w') as f:
        json.dump(pairings, f, indent=4)

if __name__ == "__main__":
    start()