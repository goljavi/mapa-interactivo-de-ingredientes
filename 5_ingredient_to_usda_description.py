import json
import openai

# Define a generator function to loop over a list in chunks of a specified size
def loop_with_steps(list_to_loop, step):
    """
    Loops over a list, getting a specified number of items per loop.

    Args:
        list_to_loop: The list to loop over.
        step: The number of items to get per loop.

    Yields:
        A list of the specified number of items.
    """
    for i in range(0, len(list_to_loop), step):
        yield list_to_loop[i:i+step]

# Define the main function to start the translation and labeling process
def start():
    # Load ingredient pairings data
    pairings_data = None
    with open('./formatted/ingredient-pairs.json', 'r', encoding='utf-8') as file:
        pairings_data = json.loads(file.read())

    # Load USDA foundation ingredients data
    usda_foundation = None
    with open('./raw/usda-foundation-ingredients.json', 'r', encoding='utf-8') as file:
        usda_foundation = json.loads(file.read())

    # Extract descriptions of foundation foods from the USDA data
    descriptions = list(map(lambda food: food["description"], usda_foundation["FoundationFoods"])).join(', ')

    # Initialize a list to store GPT classifications
    gpt_classifications = []

    # Loop over pairings data in chunks
    for chunk in loop_with_steps(pairings_data, 10):
        # Initialize a string to store ingredient translations and labels
        ingredients_string = ''
        # Concatenate ingredient pairs into a string
        for pairing in chunk:
            ingredients_string = f"{ingredients_string} {pairing["ing1"]} | \n"

        # Construct the prompt for GPT-4 model
        prompt = f"""
{descriptions}

You are an USDA expert, your task is to translate and then label all these ingredients correctly. If in doubt, pick whatever label fits best but it has to be a label that is present on the list above. When in doubt pick the closest label possible. For example:

mozzarella | mozzarella | Cheese, mozzarella, low moisture, part-skim
carne | Meat | Beef, ground, 90% lean meat / 10% fat, raw
tomate | Tomato | Tomatoes, grape, raw
cebolla | Onion | Onions, yellow, raw

Now do the same for the following ingredients. You must translate them and pick a label for each one no matter what, even if you think it's not listed, select the best one possible. Only answer with the items and nothing else.

{ingredients_string}
        """

        # Call OpenAI's ChatCompletion API to generate responses
        response = openai.ChatCompletion.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            temperature=0.7,
        )

        # Extract and append GPT-generated classifications to the list
        gpt_classifications.append(response["choices"][0]["message"]["content"].split(sep=' | '))

    # Write GPT classifications to a JSON file
    with open('./formatted/ingredient-to-usda-foundation.json', 'w') as f:
        json.dump(gpt_classifications, f, indent=4)

# Entry point of the script
if __name__ == "__main__":
    start()