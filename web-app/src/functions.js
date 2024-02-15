import pairings from './ingredient-recomendation-matrix.json';

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
