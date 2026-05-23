import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faUtensils, faBookmark } from '@fortawesome/free-solid-svg-icons';

import Select from 'react-select';
import ModalShell from '../../../components/ModalShell.js';
import { createReactSelectStyles } from '../../../utils/reactSelectStyles.js';

const aisles = ["produce", "meat", "dairy", "freezer", "other"];

const AddIngredientModal = ({ isOpen, onClose, onAdd, groceryList }) => {
    const [mode, setMode] = useState('custom');
    const [newItem, setNewItem] = useState({ name: '', amount: '1', type: 'other' });
    const [selectedRecipeId, setSelectedRecipeId] = useState('');

    const { allRecipesSorted, favoriteRecipes } = useSelector(state => state.recipes);
    const combinedRecipes = Array.from(
        new Map([...allRecipesSorted, ...favoriteRecipes].map(r => [r.fbid || r.id, r])).values()
    ).sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

    useEffect(() => {
        if (!isOpen) return;
        setMode('custom');
        setNewItem({ name: '', amount: '1', type: 'other' });
        setSelectedRecipeId('');
    }, [isOpen]);
    
    if (!isOpen) return null;

    let allRecipesById = {};
    combinedRecipes && combinedRecipes.forEach(function(r) {
        allRecipesById[r.id] = r;
    });

    let recipeOptions = [{ value: '', label: 'Choose a recipe...' }];
    recipeOptions = recipeOptions.concat((combinedRecipes && combinedRecipes.length ? combinedRecipes.map((recipe) => ({
        value: recipe.id,
        label: recipe.name,
        isFavorite: recipe.favorited
    })) : []));

    const selectStyles = createReactSelectStyles({ fontSize: '20px', menuPortalZIndex: 9999 });

    const handleSubmit = () => {
        if (mode === 'custom') {
            if (!newItem.name.trim()) return;
            const formattedItem = { 
                ...newItem, 
                type: newItem.type === 'other' ? '' : newItem.type,
                crossed: false 
            };
            onAdd(formattedItem);
        } else if (mode === 'recipe') {
            let groceryListRecipe;
            let match = groceryList.recipes.some((r) => {
                if (r?.recipe?.id === selectedRecipeId) {
                    groceryListRecipe = r?.recipe;
                    return true;
                }
            });

            if (match) {
                let duplicateCount = 2;
                if (groceryListRecipe?.duplicateCount)
                    duplicateCount = groceryListRecipe.duplicateCount + 1;

                const newIngredients = [
                    ...groceryListRecipe.ingredients, 
                    ...(allRecipesById[selectedRecipeId].ingredients.map((ing) => { return { ...ing, duplicate: duplicateCount } }))
                ];
                onAdd(undefined, { id: selectedRecipeId, recipe: { ...groceryListRecipe, ingredients: newIngredients, duplicateCount } });
            } else {
                onAdd(undefined, { id: selectedRecipeId, recipe: allRecipesById[selectedRecipeId] });
            }
        }
        
        setNewItem({ name: '', amount: '1', type: 'other' });
        setMode('custom');
    };
    
    const onCancel = (e) => {
        setNewItem({ name: '', amount: '1', type: 'other' });
        setMode('custom');
        onClose(e);
    };

    const titleId = 'add-ingredient-modal-title';

    return (
        <ModalShell onClose={onCancel} titleId={titleId}>
                <div className="bg-brand p-6 text-white text-center">
                    <div className="flex bg-blue-700/50 rounded-xl p-1 mb-3" role="tablist" aria-label="Add item type">
                        <button 
                            type="button"
                            role="tab"
                            aria-selected={mode === 'custom'}
                            onClick={() => setMode('custom')}
                            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${mode === 'custom' ? 'bg-white text-brand shadow-sm' : 'text-white/70'}`}
                        >
                            Custom
                        </button>
                        <button 
                            type="button"
                            role="tab"
                            aria-selected={mode === 'recipe'}
                            onClick={() => setMode('recipe')}
                            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${mode === 'recipe' ? 'bg-white text-brand shadow-sm' : 'text-white/70'}`}
                        >
                            Recipe
                        </button>
                    </div>
                    <div className="text-center">
                        <FontAwesomeIcon icon={mode === 'custom' ? faPlus : faUtensils} className="text-2xl mb-2" aria-hidden="true" />
                        <h3 id={titleId} className="text-lg font-bold uppercase tracking-widest">
                            {mode === 'custom' ? 'Add Custom Item' : 'Add Recipe Ingredients'}
                        </h3>
                    </div>
                </div>
                
                <div className="p-6 space-y-4">
                {mode === 'custom' ? (
                    <>
                    <div>
                        <label className="text-[14px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Aisle / Category</label>
                        <Select
                            styles={selectStyles}
                            options={aisles.map(a => { return { value: a, label: a.toUpperCase() } })}
                            onChange={(target) => setNewItem({...newItem, type: target.value})}
                            aria-label="Aisle or category"
                        />
                    </div>
                    <div className="flex gap-3">
                        <div className="w-1/3">
                            <label className="text-[14px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Amount</label>
                            <input 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-brand/30"
                                placeholder="1"
                                value={newItem.amount}
                                onChange={(e) => setNewItem({...newItem, amount: e.target.value})}
                            />
                        </div>
                        <div className="w-2/3">
                            <label className="text-[14px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Ingredient</label>
                            <input 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-brand/30"
                                placeholder="Milk"
                                value={newItem.name}
                                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                                autoFocus
                            />
                        </div>
                    </div>
                    </>
                ) : 
                    <div>
                        <label className="text-[14px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Select Recipe</label>
                        <Select
                            styles={selectStyles}
                            options={recipeOptions}
                            formatOptionLabel={({ label, isFavorite }) => (
                                <div className="flex items-center">
                                    {isFavorite && (
                                    <FontAwesomeIcon 
                                        icon={faBookmark} 
                                        className="text-amber-600 mr-2 text-sm" 
                                        aria-hidden="true"
                                    />
                                    )}
                                    <span>{label}</span>
                                </div>
                            )}
                            onChange={(target) => setSelectedRecipeId(target.value)}
                            aria-label="Select recipe"
                        />
                    </div>
                }

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onCancel} className="flex-1 py-3 font-bold text-slate-400 uppercase text-xs tracking-widest">Cancel</button>
                        <button type="button" onClick={handleSubmit} className="flex-1 py-3 bg-brand text-white rounded-xl font-bold shadow-lg uppercase text-xs tracking-widest">
                            Add to List
                        </button>
                    </div>
                </div>
        </ModalShell>
    );
};

export default AddIngredientModal;
