import React from 'react';

const ingredientsSeparator = ', ';

function RecipeItemIngredients({ ingredients }) {
  return (
    <div className="Ingredients text-left">
        {ingredients.map((ingredient, i) => {
            let separator = i ? ingredientsSeparator : '';

            return <span key={i} className="Ingredient">{separator}{ingredient.amount} {ingredient.name}</span>
        })}
    </div>
  );
}

export default RecipeItemIngredients;