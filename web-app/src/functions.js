// Importing necessary data files
import pairings from './ingredient-recomendation-matrix.json';
import formattedRecipes from './formatted-recipes.json';
import USDA from './usda-foundation-ingredients.json';
import ingredientToUsda from './ingredient-to-usda-foundation.json';
import clasificacionDulceSalado from './clasificacion-ingredientes-dulce-salado.json';

// Function to recommend ingredients based on user input
export function recommendIngredient(userIngredients) {
    // Initialize an empty object to store ingredient recommendations
    const recommendations = {};

    // Iterate through user's ingredients
    userIngredients.forEach(ingredient => {
        // Check if the ingredient has pairings
        if (pairings[ingredient]) {
            // Iterate through the pairings and count occurrences
            Object.entries(pairings[ingredient]).forEach(([pair, count]) => {
                // If the paired ingredient is not in user's list, add it to recommendations
                if (!userIngredients.includes(pair)) {
                    recommendations[pair] = (recommendations[pair] || 0) + count;
                }
            });
        }
    });

    // Sort recommendations by count in descending order and return the top three
    const recommended = Object.entries(recommendations).sort((a, b) => b[1] - a[1]).slice(0, 3);
    // Return recommended ingredients or null if none found
    return recommended && recommended.length ? recommended.map(x => x[0]) : null;
}

// Function to find recipes containing specified ingredients
export function findRecipesWithIngredients(searchIngredients, qty = 3) {
    // Filter recipes that contain all of the search ingredients
    const filteredRecipes = formattedRecipes.filter(recipe =>
        searchIngredients.every(ingredient =>
            recipe.ingredients.includes(ingredient)
        )
    );

    // Shuffle the filtered recipes to randomize them
    const shuffledRecipes = filteredRecipes.sort(() => 0.5 - Math.random());

    // Select up to three recipes from the shuffled list
    return shuffledRecipes.slice(0, qty);
}

// Function to retrieve USDA information for a given ingredient
export function ingredientToUSDAInfo(ingredient) {
    // Find the corresponding USDA description for the ingredient
    const usdaDescriptionArr = ingredientToUsda.find(x => x[0] === ingredient);
    if (!usdaDescriptionArr) return;

    // Extract the USDA description
    const usdaDescription = usdaDescriptionArr[usdaDescriptionArr.length - 1];

    // Find the food item in USDA Foundation Foods data
    let food = USDA.FoundationFoods.find(x => x.description.includes(usdaDescription));
    if (!food) {
        // If exact match not found, try to find using a substring of the description
        food = USDA.FoundationFoods.find(x => x.description.includes(usdaDescription.split(',')[0]));
    }

    return food; // Return the found USDA information
}

// Function to get color classification for an ingredient (sweet, savory, or neutral)
export function getClasif(ingredient) {
    // Find the classification for the ingredient
    const clasif = clasificacionDulceSalado.find(x => x[0] === ingredient);
    if (!clasif) return null;

    // Return a color code based on the classification
    switch (clasif[1]) {
        case "Salado":
            return "#1f77b4"; // Blue for savory
        case "Dulce":
            return "#d32f2f"; // Red for sweet
        case "Indistinto":
            return "#008107"; // Green for neutral
        default:
            return "#1f77b4"; // Blue by default
    }
}

export function getAllNutrientNames() {
    const allNutrients = USDA.FoundationFoods.map(x => x.foodNutrients).flat().map(x => ({name: x.nutrient.name, unit: x.nutrient.unitName}));
    const toReturn = [];
    allNutrients.forEach(x => {
        if(toReturn.find(y => y.name === x.name)) return;
        toReturn.push(x);
    });
    return toReturn;
}