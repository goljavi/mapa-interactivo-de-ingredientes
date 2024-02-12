import json

recipes = None
with open('/formatted/formatted-recipes.json', 'r', encoding='utf-8') as file:
      recipes = json.loads(file.read())

# Initialize a dictionary to count ingredient pairs
ingredient_pairs = {}

# Iterate through each recipe
for recipe in recipes:
    # Get all unique pairs of ingredients in each recipe
    ingredients = recipe["ingredients"]
    for i in range(len(ingredients)):
        for j in range(i + 1, len(ingredients)):
            # Sort the pair to ensure consistency (alphabetical order)
            pair = tuple(sorted([ingredients[i], ingredients[j]]))
            # Increment the count for this pair in the dictionary
            if pair in ingredient_pairs:
                ingredient_pairs[pair] += 1
            else:
                ingredient_pairs[pair] = 1

# Convert the dictionary to the desired list format
ingredient_pairs_list = [{"ing1": pair[0], "ing2": pair[1], "count": count} for pair, count in ingredient_pairs.items()]

with open('/formatted/ingredient-pairs.json', 'w') as f:
    json.dump(ingredient_pairs_list, f, indent=4)