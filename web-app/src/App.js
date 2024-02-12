import React from 'react';
import pairings from './ingredient-recomendation-matrix.json';

function App() {
  React.useEffect(() => {    
    // Recommendation function
    function recommendIngredient(userIngredients) {
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
    
    // Example user input
    const userIngredients = ["carne", "ajo"];
    // Get recommendation
    const recommendation = recommendIngredient(userIngredients);
    
    console.log(recommendation);
  }, []);

  return (
    <div>
      
    </div>
  );
}

export default App;
