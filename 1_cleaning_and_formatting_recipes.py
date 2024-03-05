from bs4 import BeautifulSoup
import os
import json
import re
from unidecode import unidecode
from common.replacements import replacements

def load_html_files(html_files_directory):
  soups = []
  for file_name in os.listdir(html_files_directory):
    with open(os.path.join(html_files_directory, file_name), 'r', encoding='utf-8') as file:
      soups.append((BeautifulSoup(file.read(), "html.parser"), file_name))

  return soups

def apply_transformations(text):
  word_array = ['unidades', 'unidad', 'lonchas', 'loncha', 'onzas', 'piezas', 'onza', 'pieza', 'gramos', 'vasos', 'vaso', 'mililitros', 'kilogramos', 'kilogramo', 's', 'g', 'g.', 'gr', 'gr.', 'cc', 'cucharadas', 'cucharadita', 'cucharada' 'taza', 'tazas', 'ml', 'kg', 'kgr', 'litro', 'porciones', 'de', 'cc.', 'cda', 'cdas', 'cdas.', 'cdita', 'cdtas..']

  # Eliminar todo el contenido entre paréntesis, incluyendo los propios paréntesis
  text = re.sub( r'\([^)]*\)', '', text)

  # Eliminar la cantidad de cada ingrediente usando la expresión regular
  text = re.sub(r"^\d+\s*("+'|'.join(word_array)+")?\s*", '', text)

  # Eliminar los números
  text = re.sub(r'\d+', '', text)

  # Elimina todo lo que venga después de "o"
  pos_separador = text.find(" o ")
  if pos_separador != -1:
    text = text[:pos_separador]

  # Elimina todo lo que venga después de "/"
  pos_separador = text.find(" / ")
  if pos_separador != -1:
    text = text[:pos_separador]

  for replacement in replacements:
    text = text.replace(replacement[0], replacement[1])

  text = text.strip()

  words_in_string = text.split()
  # Check if the first word is in the array
  if words_in_string and words_in_string[0] in word_array:
      # Remove the first word
      text = ' '.join(words_in_string[1:])

  suffixes = [" s ", " s, ", ", ", " s", " s,", " s, en", ",", ",  "]
  for suffix in suffixes:
    if text.endswith(suffix):
      # Remove the suffix from the string
      text = text[:-len(suffix)]

  return text

def remove_entire(ing):
  entire_string = ["y", "de", ",", "s", "en s", 'en rusa', "en", "des", "bon", "ados", "ado", "adas", "aceit", "gr", "cc", "cdas"]
  for ent in entire_string:
    if ing == ent:
      ing = ''

  prefixes = ["de "]
  for prefix in prefixes:
    if ing.startswith(prefix):
      # Remove the prefix from the string
      ing = ing[len(prefix):]

  return ing.strip()

def format_title(title):
  title = str(title.text)
  title_stripped = title.strip()
  title_cleaned = re.sub(r'[^\x00-\x7F]+', '', title_stripped)
  return title_cleaned

def format_cookpad(soups):
  formatted_recipes = []

  for soup, file_name in soups:
    ingredients = []
    title = format_title(soup.find('h1', itemprop='name'))
    recipeIngredients = soup.find_all('div', itemprop='recipeIngredient')
    steps = soup.find('div', id='steps')

    for recipeIngredient in recipeIngredients:

      # Extract quantity and ingredient text
      ingredient_text = unidecode(recipeIngredient.contents[2].strip().lower())
      ingredient_text = apply_transformations(ingredient_text).strip()

      if(ingredient_text):
        ing_text_split = ingredient_text.split(', ')
        for ing in ing_text_split:
          ing = remove_entire(ing)
          if ing and ing not in ingredients:
            ingredients.append(ing)

    formatted_recipes.append({ "title": title, "ingredients": ingredients, "url": 'https://cookpad.com/ar/recetas/' + file_name.replace('.html', '') })

  return formatted_recipes

def format_recetasgratis(soups):
  formatted_recipes = []

  for soup, file_name in soups:
    ingredients = []
    title = format_title(soup.find('h1', class_='titulo titulo--articulo'))
    recipeIngredients = soup.find_all('li', class_='ingrediente')
    recipeIngredients = [li for li in recipeIngredients if 'titulo' not in li.get('class')]

    for recipeIngredient in recipeIngredients:

      label = recipeIngredient.find('label')
      if label:
          label = label.text
          lines = [line.strip() for line in label.strip().split('\n') if line.strip()]
          label = lines[0] if lines else None
          if label:
            ingredient_text = unidecode(label.strip().lower())
            ingredient_text = apply_transformations(ingredient_text)

            if(ingredient_text):
              ing_text_split = ingredient_text.split(', ')
              for ing in ing_text_split:
                ing = remove_entire(ing)
                if ing and ing not in ingredients:
                  ingredients.append(ing)


    formatted_recipes.append({ "title": title, "ingredients": ingredients, "url": 'https://www.recetasgratis.net/' + file_name.replace('.html', '') })

  return formatted_recipes

def format_saborargento(soups):
  formatted_recipes = []

  for soup, file_name in soups:
    ingredients = []
    title = format_title(soup.find('h1'))

    # Find the starting <h3> tag
    start_tag = soup.find('h3', id="✍-ingredientes-de-del-nombre-de-receta")

    # Find the ending <h3> tag
    end_tag = soup.find('h3', id="🥘-como-hacer-nombre-de-receta")

    # Extract all <li> tags between these two
    items = []
    for tag in start_tag.find_next_siblings():
        if tag == end_tag:
            break
        if tag.name == 'ul':
            items.extend(tag.find_all('li'))

    # Extract the text from each <li> tag
    items_text = [item.text for item in items]

    for item in items_text:
      ingredient_text = unidecode(item.strip().lower())
      ingredient_text = apply_transformations(ingredient_text).strip()

      if(ingredient_text):
        ing_text_split = ingredient_text.split(', ')
        for ing in ing_text_split:
          ing = remove_entire(ing)
          if ing and ing not in ingredients:
            ingredients.append(ing)

    formatted_recipes.append({ "title": title, "ingredients": ingredients, "url": 'https://saborargento.com.ar/' + file_name.replace('.html', '') })

  return formatted_recipes

def start():
  directories = [
      ("/raw/cookpad-html", format_cookpad),
      ("/raw/recetasgratis-html", format_recetasgratis),
      ("/raw/saborargento-html", format_saborargento)
  ]

  all_formatted_recipes = []
  for dir, func in directories:
      soups = load_html_files(dir)
      all_formatted_recipes.extend(func(soups))

  with open('/formatted/formatted-recipes.json', 'w') as f:
      json.dump(all_formatted_recipes, f, indent=4)

if __name__ == "__main__":
  start()