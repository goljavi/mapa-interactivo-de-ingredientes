# Interactive Kitchen Ingredients Map

[https://mapa-de-ingredientes-empanadas.web.app/](See the website here)

## Description

The Interactive Kitchen Ingredients Map is an innovative web application designed to simplify the exploration of recipes and promote a diverse and healthy diet. By utilizing web scraping techniques, this project gathers data from various recipe websites. It then creates a graph where ingredients are visualized based on their frequency of use and combinations in different recipes. Users can select ingredients on the graph to see related recipes and suggestions for complementary ingredients. Additionally, nutritional values are added to each ingredient to enhance understanding of dietary impacts. The proof of concept is implemented as a WebApp, offering an interactive interface for exploring ingredient combinations and discovering new recipes.

## Functional Requirements

- **Web Scraping:** Collect recipe data from websites.
- **Data Processing:** Normalize and analyze the collected ingredients and recipes.
- **Recommendation Algorithm:** Recommend the three best complementary ingredients for an existing ingredient list.
- **Data Visualization:** Create a graph showing the relationships between ingredients.
- **Ingredient Recommendation:** Suggest ingredients based on user selections.
- **Nutritional Information Integration:** Add nutritional values to each ingredient.
- **User Interface:** WebApp for user interaction.

## Dependencies

- **Python:** Beautiful Soup, OpenAI SDK, unidecode, requests
- **JavaScript:** React, D3.js, MUI v5

## Data

- List of ingredients and recipes from cooking websites.
- Nutritional information of ingredients.

## Data Processing

- Frequency of ingredient use in recipes.
- Common ingredient combinations.
- Ingredient clasification

## Technologies

- **Python:** For scraping and data processing.
- **Json:** For data storage.
- **React and D3.js:** For the WebApp.
- **Firebase:** To host the WebApp.

## Execution and Environment

Data collection and processing will be executed in .py files, and the data will be dumped into various JSON files. The WebApp will be hosted on a web server, where users can interact with the graph. Recommendations and nutritional information will be presented in a user-friendly and educational interface.

## Getting Started

To get started with the Interactive Kitchen Ingredients Map, follow these steps:

1. **Clone the Repository:**

```bash
git clone https://github.com/goljavi/mapa-interactivo-de-ingredientes.git
cd mapa-interactivo-de-ingredientes
```

2. **Set Up the Python Environment:**

Ensure you have Python installed. Then, install the required Python libraries:

```bash
pip install -r requirements.txt
```

3. **Run the Data Collection Scripts:**

Start with the web scraping script to collect recipe data:

```bash
python 0_scraping.py
```

Follow the sequence of scripts to clean, format, and process the data.

4. **Set Up the WebApp:**

Navigate to the `web-app` directory and install the necessary JavaScript libraries:

```bash
cd web-app
npm install
```

5. **Start the WebApp:**

Launch the application locally:

```bash
npm start
```

This command will open the Interactive Kitchen Ingredients Map in your default web browser, where you can start exploring recipes and ingredients interactively.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

Feel free to contribute to the project or use it as inspiration for your own developments. Enjoy exploring the vast world of recipes and ingredients with our Interactive Kitchen Ingredients Map!
