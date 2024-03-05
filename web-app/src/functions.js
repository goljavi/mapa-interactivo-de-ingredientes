import pairings from './ingredient-recomendation-matrix.json';
import formattedRecipes from './formatted-recipes.json';
import USDA from './usda-foundation-ingredients.json';
import ingredientToUsda from './ingredient-to-usda-foundation.json';

export function recommendIngredient(userIngredients) {
    const recommendations = {};

    userIngredients.forEach(ingredient => {
        if (pairings[ingredient]) {
            Object.entries(pairings[ingredient]).forEach(([pair, count]) => {
                if (!userIngredients.includes(pair)) {
                    recommendations[pair] = (recommendations[pair] || 0) + count;
                }
            });
        }
    });

    // Sort recommendations by count and return the top one
    const recommended = Object.entries(recommendations).sort((a, b) => b[1] - a[1]).slice(0,3);
    return recommended && recommended.length ? recommended.map(x => x[0]) : null;
}

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

export function ingredientToUSDAInfo(ingredient) {
    const usdaDescriptionArr = ingredientToUsda.find(x => x[0] === ingredient);
    if(!usdaDescriptionArr) return;

    const usdaDescription = usdaDescriptionArr[usdaDescriptionArr.length - 1];

    let food = USDA.FoundationFoods.find(x => x.description.includes(usdaDescription));
    if(!food) {
        food = USDA.FoundationFoods.find(x => x.description.includes(usdaDescription.split(',')[0]));
    }

    return food;
}