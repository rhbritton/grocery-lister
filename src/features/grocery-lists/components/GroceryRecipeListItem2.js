import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTrash, 
  faMinus, 
  faPlus, 
  faCheckCircle, 
  faCircle, 
  faUtensils,
  faCheck
} from '@fortawesome/free-solid-svg-icons';

function GroceryRecipeListItem(props) {
    const recipe = props.recipe;
    const recipes = props.recipes;
    const setRecipes = props.setRecipes;

    // --- Logic (Functionality Kept Exactly the Same) ---
    const toggleIngredient = (ingredientIndex, cross) => {
        const updatedRecipes = recipes.map((r) => {
            if (r.id === recipe.id) {
                return {
                    ...r,
                    recipe: {
                        ...r.recipe,
                        ingredients: r.recipe.ingredients.map((ingredient, i) => {
                            if (i === ingredientIndex) {
                                return { ...ingredient, crossed: cross };
                            }
                            return ingredient;
                        }),
                    },
                };
            }
            return r;
        });
        setRecipes(updatedRecipes);
    };

    const updateRecipeIngredients = (recipesToUpdate, recipe_id, ingredients) => {
        return recipesToUpdate.map(r => 
            r.id === recipe_id 
                ? { ...r, recipe: { ...r.recipe, ingredients: ingredients.map(ing => ing) } } 
                : r
        );
    }

    const updateRecipeDuplicateCount = (recipesToUpdate, recipe_id, duplicateCount) => {
        return recipesToUpdate.map(r => 
            r.id === recipe_id 
                ? { ...r, recipe: { ...r.recipe, duplicateCount } } 
                : r
        );
    }

    const getOrigIngredients = (duplicate) => {
        let originalIngredients = [];
        recipe.recipe.ingredients.forEach((ingredient) => {
            if (ingredient.duplicate === undefined)
                originalIngredients.push({ duplicate, ...ingredient})
        });
        return originalIngredients;
    }

    const handleDuplication = (recipeData, diff) => {
        if (diff === 1) {
            let originalIngredients = getOrigIngredients((recipeData.duplicateCount || 1) + 1);
            originalIngredients = originalIngredients.map((ing) => {
                delete ing.crossed;
                return ing;
            })
            let newIngredients = [...recipeData.ingredients, ...originalIngredients];
            let updatedRecipes = updateRecipeIngredients(recipes, recipe.id, newIngredients);
            updatedRecipes = updateRecipeDuplicateCount(updatedRecipes, recipe.id, (recipeData.duplicateCount || 1) + 1);
            setRecipes(updatedRecipes);
        }

        if (diff === -1 && recipeData.duplicateCount > 1) {
            let newIngredients = recipeData.ingredients.filter(ing => ing.duplicate !== recipeData.duplicateCount);
            let updatedRecipes = updateRecipeIngredients(recipes, recipe.id, newIngredients);
            updatedRecipes = updateRecipeDuplicateCount(updatedRecipes, recipe.id, (recipeData.duplicateCount || 1) - 1);
            setRecipes(updatedRecipes);
        }
    }

    return (
        <div className="bg-white w-full rounded-3xl shadow-xl border border-slate-200 relative overflow-hidden mb-8 animate-in fade-in duration-500">
            
            {/* 1. Notebook Margin Line (Red Line) */}
            <div className="absolute left-14 top-0 bottom-0 w-px bg-red-300/40 z-30 pointer-events-none" />

            <header className="relative z-10 bg-slate-200/90 px-6 py-4 border-b border-slate-300/50 flex items-center justify-between">
    {/* Left Side: Name and Stepper Stack */}
    <div className="flex flex-col gap-2 pl-10"> {/* Offset for red margin line */}
        
        {/* Recipe Name Row */}
        <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faUtensils} className="text-slate-500 text-xs" />
            <h2 className="text-[15px] font-black uppercase tracking-[0.2em] text-slate-700 truncate max-w-[200px] sm:max-w-none">
                {recipe.recipe.name}
            </h2>
        </div>

        {/* Counter Row (Stepper) */}
        <div className="flex items-center w-fit bg-white/60 border border-slate-300/50 rounded-xl p-1 shadow-sm">
            <button
                type="button"
                disabled={!recipe.recipe.duplicateCount || recipe.recipe.duplicateCount <= 1}
                onClick={(e) => { e.stopPropagation(); handleDuplication(recipe.recipe, -1); }}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white disabled:opacity-20 transition-all active:scale-90"
            >
                <FontAwesomeIcon icon={faMinus} className="text-[10px]" />
            </button> 
            
            <div className="px-3 flex flex-col items-center leading-none">
                <span className="text-[16px] font-black text-[#1976D2]">
                    {recipe.recipe.duplicateCount || 1}
                </span>
                <span className="text-[8px] font-black uppercase tracking-tighter text-slate-400">
                    Count
                </span>
            </div>

            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleDuplication(recipe.recipe, 1); }}
                className="w-6 h-6 flex items-center justify-center rounded-lg bg-[#1976D2] text-white shadow-md active:scale-90 transition-all"
            >
                <FontAwesomeIcon icon={faPlus} className="text-[12px]" />
            </button>
        </div>
    </div>
</header>

            {/* 3. Ingredients mapped on "lined paper" */}
            <div className="divide-y divide-slate-200/40 relative z-10">
                {recipe.recipe.ingredients.map((ingredient, index) => {
                    const isNewGroup = ingredient.duplicate && ingredient.duplicate !== recipe.recipe.ingredients[index - 1]?.duplicate;
                    
                    return (
                        <div key={recipe.recipe.id + ingredient.name + index} className="flex flex-col">
                            {/* Duplicate Group Label - Integrated into paper lines */}
                            {isNewGroup && (
                                <div className="bg-blue-50/30 px-16 py-1.5 border-b border-slate-200/40">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1976D2]/60">
                                        Batch #{ingredient.duplicate}
                                    </span>
                                </div>
                            )}

                            <div 
                                onClick={() => toggleIngredient(index, !ingredient.crossed)}
                                className={`flex items-stretch transition-all duration-700
                                    ${ingredient.crossed ? 'bg-slate-50' : 'bg-white hover:bg-blue-50/20'}`}
                            >
                                {/* CHECK ZONE: Left of red line */}
                                <div className="w-14 shrink-0 flex items-center justify-center">
                                    <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all shadow-sm
                                        ${ingredient.crossed 
                                            ? 'bg-[#1976D2] border-[#1976D2] scale-110' 
                                            : 'bg-white border-slate-200'}`}
                                    >
                                        {ingredient.crossed && <FontAwesomeIcon icon={faCheck} className="text-white text-[10px]" />}
                                        {!ingredient.crossed && <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />}
                                    </div>
                                </div>

                                {/* TEXT CONTENT ZONE: Right of red line */}
                                <div className="flex-1 flex items-center gap-3 pl-5 pr-4 py-5 cursor-pointer overflow-hidden">
                                    <span className={`text-[14px] font-black uppercase tracking-tighter shrink-0 transition-all
                                        ${ingredient.crossed ? 'text-slate-300' : 'text-[#1976D2]'}`}>
                                        {ingredient.amount}
                                    </span>
                                    <span className={`text-[16px] font-bold truncate transition-all
                                        ${ingredient.crossed ? 'text-slate-300 line-through decoration-slate-300' : 'text-slate-800'}`}>
                                        {ingredient.name}
                                    </span>
                                    
                                    {/* Aisle Badge */}
                                    <span className={`text-[10px] font-black uppercase tracking-widest ml-auto px-2 py-1 rounded-lg transition-all
                                        ${ingredient.crossed ? 'text-slate-200 bg-slate-100/50' : 'text-slate-400 bg-slate-50'}`}>
                                        {ingredient.type || 'other'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default GroceryRecipeListItem;