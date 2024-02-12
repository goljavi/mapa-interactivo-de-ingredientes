import requests
from bs4 import BeautifulSoup
import os
import json

"""# Extraer urls de recetas de cookpad"""

cookpad_urls_files_directory = '/raw/cookpad-urls'

for a in range(0,13):
  response = requests.get(f"https://cookpad.com/ar/buscar/argentina?page={a}", headers={
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  })
  soup = BeautifulSoup(response.content, "html.parser")
  links = soup.find_all("a", class_="block-link__main")

  if(len(links)):
    hrefs = [link.get("href") for link in links]
    soupFile = json.dumps(hrefs)
    with open(f'{cookpad_urls_files_directory}/output-cookpad-{a}.json', 'w') as f:
          f.write(soupFile)
  else:
    print('No links', a)

"""# Descargar las recetas de cookpad"""

cookpad_urls_files_directory = '/raw/cookpad-urls'
cookpad_html_files_directory = '/raw/cookpad-html'

already_scrapped = []
all_urls = []

with open(os.path.join(cookpad_urls_files_directory, 'output-already-scrapped-cookpad.json'), 'r', encoding='utf-8') as file:
        already_scrapped.extend(json.load(file))

for file_name in os.listdir(cookpad_urls_files_directory):
      with open(os.path.join(cookpad_urls_files_directory, file_name), 'r', encoding='utf-8') as file:
        all_urls.extend(json.load(file))

def scraper(url):
    response = requests.get(f'https://cookpad.com/{url}', headers={
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    })
    html = response.content
    soup = BeautifulSoup(html, "html.parser")
    find = soup.find_all("div", class_="text-cookpad-gray-500")
    if(len(find)):
      with open(f'{cookpad_html_files_directory}/{url.replace("/ar/recetas/","")}.html', 'wb') as f:
          f.write(html)

      return True
    else:
      print('No recipe', url)
      return False

for url in all_urls:
  if url not in already_scrapped:
    result = scraper(url)

    if(result):
      already_scrapped.append(url)
    else:
      already_scrapped_json = json.dumps(already_scrapped)
      with open(f'{cookpad_urls_files_directory}/output-already-scrapped-cookpad.json', 'w') as f:
          f.write(already_scrapped_json)
      break

"""# Extraer URLs de Recetasgratis.net"""

recetasgratis_urls_files_directory = '/raw/recetasgratis-urls'

for a in range(0,7):
  response = requests.get(f"https://www.recetasgratis.net/recetas-argentinas{f'/{a}' if a > 0 else ''}", headers={
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  })
  soup = BeautifulSoup(response.content, "html.parser")
  links = soup.find_all("a", class_="titulo titulo--resultado")

  if(len(links)):
    hrefs = [link.get("href") for link in links]
    soupFile = json.dumps(hrefs)
    with open(f'{recetasgratis_urls_files_directory}/output-recetasgratis-{a}.json', 'w') as f:
          f.write(soupFile)
  else:
    print('No links', a)


"""# Descargar las recetas de Recetasgratis.net"""

recetasgratis_urls_files_directory = '/raw/recetasgratis-urls'
recetasgratis_html_files_directory = '/raw/recetasgratis-html'

all_urls = []

for file_name in os.listdir(recetasgratis_urls_files_directory):
      with open(os.path.join(recetasgratis_urls_files_directory, file_name), 'r', encoding='utf-8') as file:
        all_urls.extend(json.load(file))

def scraper(url):
    response = requests.get(url, headers={
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    })
    html = response.content
    soup = BeautifulSoup(html, "html.parser")
    find = soup.find_all("h1", class_="titulo titulo--articulo")
    if(len(find)):
      with open(f'{recetasgratis_html_files_directory}/{url.replace("https://www.recetasgratis.net/","")}.html', 'wb') as f:
          f.write(html)

      return True
    else:
      print('No recipe', url)
      return False

for url in all_urls:
  if url not in already_scrapped:
    result = scraper(url)

    if(result):
      already_scrapped.append(url)
    else:
      break

"""# Extraer URLs de Saborargento.com.ar"""

recetasgratis_urls_files_directory = '/raw/saborargento-urls'

response = requests.get(f"https://saborargento.com.ar/", headers={
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
})
soup = BeautifulSoup(response.content, "html.parser")
links = soup.find_all("a", class_="post-item post-grid-item vertical")

if(len(links)):
  hrefs = [link.get("href") for link in links]
  soupFile = json.dumps(hrefs)
  with open(f'{recetasgratis_urls_files_directory}/output-saborargento.json', 'w') as f:
        f.write(soupFile)
else:
  print('No links', a)

"""# Descargar las recetas de Saborargento.com.ar"""

saborargento_urls_files_directory = '/raw/saborargento-urls'
saborargento_html_files_directory = '/raw/saborargento-html'

all_urls = []

for file_name in os.listdir(saborargento_urls_files_directory):
      with open(os.path.join(saborargento_urls_files_directory, file_name), 'r', encoding='utf-8') as file:
        all_urls.extend(json.load(file))

def scraper(url):
    response = requests.get(url, headers={
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    })
    html = response.content
    soup = BeautifulSoup(html, "html.parser")
    find = soup.find_all("h2", class_="wp-block-heading js-toc-item")
    if(len(find)):
      with open(f'{saborargento_html_files_directory}/{url.replace("https://saborargento.com.ar/","").replace("/", "|")}.html', 'wb') as f:
          f.write(html)

      return True
    else:
      print('No recipe', url)
      return False

for url in all_urls:
  if url not in already_scrapped:
    result = scraper(url)

    if(result):
      already_scrapped.append(url)
    else:
      break