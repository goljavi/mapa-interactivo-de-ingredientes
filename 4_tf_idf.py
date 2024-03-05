import json
from math import log

def start():
    pairings_data = None
    with open('./formatted/ingredient-pairs.json', 'r', encoding='utf-8') as file:
        pairings_data = json.loads(file.read())

    # Calculate Document Frequency (DF) for each ingredient
    ingredient_doc_freq = {}
    for pair in pairings_data:
        if pair['ing1'] not in ingredient_doc_freq:
            ingredient_doc_freq[pair['ing1']] = 1
        else:
            ingredient_doc_freq[pair['ing1']] += 1
        if pair['ing2'] not in ingredient_doc_freq:
            ingredient_doc_freq[pair['ing2']] = 1
        else:
            ingredient_doc_freq[pair['ing2']] += 1

    # Total number of pairings (documents)
    N = len(pairings_data)

    # Calculate Inverse Document Frequency (IDF) for each ingredient
    ingredient_idf = {ingredient: log(N / df) for ingredient, df in ingredient_doc_freq.items()}

    for pair in pairings_data:
        ing1_tf_idf = pair['count'] * ingredient_idf[pair['ing1']]
        ing2_tf_idf = pair['count'] * ingredient_idf[pair['ing2']]
        pair['count'] = ing1_tf_idf + ing2_tf_idf

    with open('./formatted/ingredient-pairs-tfidf.json', 'w') as f:
        json.dump(pairings_data, f, indent=4)

if __name__ == "__main__":
    start()