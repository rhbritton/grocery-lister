import React, { useState, useEffect } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronLeft, 
  faChevronDown, 
  faEdit, 
  faShareAlt, 
  faCheck, 
  faShoppingCart,
  faCalendarAlt,
  faUserCircle,
  faReceipt,
  faSave,
  faSignOutAlt,
  faClock,
  faTag,
  faBookmark,
  faUtensils
} from '@fortawesome/free-solid-svg-icons';

import { findSelectedOption } from '../../recipes/slices/recipeSlice.ts';

function GroceryListViewItem(props) {
    const allIngredientsIndex = props.allIngredientsIndex;
    const allIngredients = props.allIngredients;

    const ingredientIndex = props.ingredient.index;
    const ingredient = props.ingredient.ingredient;
    const recipe = props.ingredient.recipe;

    const groceryList = props.groceryList;
    

    const toggleIngredient = (cross) => {
        const updatedIngredients = allIngredients.map((ing, index) => {
            if (index === allIngredientsIndex)
                return { ...ing, crossed: cross };

            return ing;
        });
        props.setAllIngredients(updatedIngredients);

        if (groceryList) {
            if (recipe) {
                let updateRecipes = [];
                groceryList.recipes.forEach(function(r, i) {
                    if (r.id == recipe.id) {
                        const updatedIngredient = { 
                            ...r.recipe.ingredients[ingredientIndex],
                            crossed: cross 
                        };
                        const updatedIngredients = r.recipe.ingredients.map((ing, index) =>
                            index === ingredientIndex ? updatedIngredient : ing
                        );
                        const updatedRecipeDetails = { 
                            ...r.recipe, 
                            ingredients: updatedIngredients 
                        };
                        const newRecipe = { 
                            ...r, 
                            recipe: updatedRecipeDetails 
                        };
                        
                        updateRecipes.push(newRecipe);
                    } else {
                        updateRecipes.push(r)
                    }
                });

                let newGroceryList = {...props.groceryList};
                newGroceryList.recipes = updateRecipes;
                props.setGroceryList(newGroceryList);
            } else {
                let updateIngredients = [];
                groceryList.ingredients.forEach(function(ing, i) {
                    if (i == ingredientIndex) {
                        updateIngredients.push({ ...ing, crossed: cross })
                    } else {
                        updateIngredients.push(ing)
                    }
                });
                
                let newGroceryList = {...props.groceryList};
                newGroceryList.ingredients = updateIngredients;
                props.setGroceryList(newGroceryList);
            }
        }
    }

    const ingredientTextCrossedStyle = {
        textDecoration: 'line-through',
        opacity: 0.4
    };

    const openWalmartTab = (ingredient) => {
        window.open(encodeURI(`https://www.walmart.com/search?q=${ingredient.ingredient.name}&sort=price_low`), "_blank")
    }

    return (
        <div className={`GroceryListViewItem flex items-stretch group transition-all 
                ${props.ingredient.crossed 
                ? 'bg-slate-200/40' 
                : props.isEven ? 'bg-white' : 'bg-blue-50/50'
                }`}
        >
            {/* 1. DEDICATED CHECK ZONE */}
            <button 
                onClick={() => toggleIngredient(!props.ingredient.crossed)}
                className={`w-14 shrink-0 flex items-center justify-center transition-all
                ${props.ingredient.crossed 
                    ? 'bg-slate-200/40' 
                    : props.isEven ? 'bg-slate-50' : 'bg-blue-50/50'
                }`}
            >
                <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all shadow-sm z-40
                ${props.ingredient.crossed 
                    ? 'bg-[#1976D2] border-[#1976D2] scale-110' 
                    : 'bg-white border-slate-300 group-hover:border-[#1976D2]'}`}
                >
                {props.ingredient.crossed && <FontAwesomeIcon icon={faCheck} className="text-white text-xs" />}
                {!props.ingredient.crossed && <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-blue-200 transition-colors" />}
                </div>
            </button>
            
            {/* 2. TEXT CONTENT ZONE */}
            <div className="flex-1 text-left pl-5 pr-2 py-5 cursor-pointer relative z-40" onClick={() => toggleIngredient(!props.ingredient.crossed)}>
                <p className={`text-base font-bold transition-all duration-300
                    ${props.ingredient.crossed ? 'text-slate-400 line-through decoration-slate-400 decoration-2' : 'text-slate-800'}`}>
                    <span className={`text-[14px] mr-1 font-black uppercase tracking-widest ${props.ingredient.crossed ? 'text-slate-300' : 'text-[#1976D2]'}`}>
                        {props.ingredient.ingredient.amount}
                    </span>
                    {props.ingredient.ingredient.name}
                </p>
                
                {/* METADATA ROW: Amount and Recipe Source */}
                <div className="flex items-center gap-2 mt-0.5">
                    {/* Recipe Attribution */}
                    <span className={`text-[14px] font-black uppercase tracking-widest ${props.ingredient.crossed ? 'text-slate-200' : 'text-slate-400'}`}>
                        {recipe?.name || 'Manual Item'}
                    </span>
                </div>
            </div>
            
            {/* 3. EXTERNAL ACTION ZONE */}
            <div className="flex items-center pr-4 relative z-40">
                <button 
                onClick={(e) => { e.stopPropagation(); }}
                className={`w-11 h-11 flex items-center justify-center transition-all rounded-2xl
                    ${props.ingredient.crossed 
                    ? 'opacity-20 grayscale' 
                    : 'bg-white/50 border border-slate-200 text-slate-400 hover:text-[#1976D2] shadow-sm active:scale-90'}`}
                >
                <FontAwesomeIcon icon={faShoppingCart} className="text-sm" />
                </button>
            </div>
        </div>
    );
}

export default GroceryListViewItem;