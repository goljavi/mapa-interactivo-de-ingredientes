import json
import openai

# Function to loop over a list and yield chunks of specified size
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

# Main function to initiate the classification task
def start():
  pairings_data = None
  # Load ingredient pairings data from a JSON file
  with open('./formatted/ingredient-pairs.json', 'r', encoding='utf-8') as file:
    pairings_data = json.loads(file.read())

  gpt_classifications = []  # Store GPT-4 classifications
  # Loop over the ingredient pairings data in chunks of 10
  for chunk in loop_with_steps(pairings_data, 10):
    ingredients_string = ''
    # Concatenate ingredient pairs in the chunk into a single string
    for pairing in chunk:
      ingredients_string = f"{ingredients_string} {pairing["ing1"]} | \n"

    # Prompt for GPT-4 classification
    prompt = f"""
Sos un experto en clasificación de ingredientes, tu tarea es clasificar los siguientes ingredientes en las siguientes categorías: "Dulce", "Salado", "Indistinto" según en qué platos sea mayormente utilizado

Por ejemplo:
carne | Salado
tomate | Salado
sal | Salado
azucar | Dulce
manzana | Dulce
esencia vainilla | Dulce
polvo hornear | Dulce
harina leudante | Dulce
Agua | Indistinto
Harina | Indistinto
Levadura | Indistinto

Ahora hacelo vos, no contestes nada extra:

{ingredients_string}
    """

    # Request GPT-4 completion for ingredient classifications
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

    # Extract classifications from GPT-4 response and append to list
    gpt_classifications.append(response["choices"][0]["message"]["content"].split(sep=' | '))

  # Write GPT-4 classifications to a JSON file
  with open('./formatted/clasificacion-ingredientes-dulce-saladon.json', 'w') as f:
      json.dump(gpt_classifications, f, indent=4)

# Entry point of the script
if __name__ == "__main__":
  start()