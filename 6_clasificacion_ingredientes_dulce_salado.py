import json
import openai

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

def start():
  pairings_data = None
  with open('./formatted/ingredient-pairs.json', 'r', encoding='utf-8') as file:
    pairings_data = json.loads(file.read())

  gpt_classifications = []
  for chunk in loop_with_steps(pairings_data, 10):
    ingredients_string = ''
    for pairing in chunk:
      ingredients_string = f"{ingredients_string} {pairing["ing1"]} | \n"

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

    gpt_classifications.append(response["choices"][0]["message"]["content"].split(sep=' | '))

  with open('./formatted/clasificacion-ingredientes-dulce-saladon.json', 'w') as f:
      json.dump(gpt_classifications, f, indent=4)

if __name__ == "__main__":
  start()