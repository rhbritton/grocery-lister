import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faChevronDown, faUtensils, faBookmark } from '@fortawesome/free-solid-svg-icons';

import Select from 'react-select';

const aisles = ["produce", "meat", "dairy", "freezer", "other"];

const AddIngredientModal = ({ isOpen, onClose, onAdd, groceryList }) => {
    const [mode, setMode] = useState('custom'); // 'custom' or 'recipe'
    const [newItem, setNewItem] = useState({ name: '', amount: '1', type: 'other' });
    const [selectedRecipeId, setSelectedRecipeId] = useState('');

    const { allRecipesSorted, favoriteRecipes } = useSelector(state => state.recipes);
    const combinedRecipes = Array.from(
        new Map([...allRecipesSorted, ...favoriteRecipes].map(r => [r.fbid || r.id, r])).values()
    ).sort((a, b) => a.name_lowercase.localeCompare(b.name_lowercase));
    
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

    const selectStyles = {
      control: (base, state) => ({
        ...base,
        fontWeight: 'bold',
        backgroundColor: '#f8fafc',
        borderRadius: '0.75rem',
        borderWidth: '1px',
        borderColor: state.isFocused ? '#1976D2' : '#777',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(25, 118, 210, 0.2)' : 'none',
        padding: '2px',
        '&:hover': { borderColor: '#cbd5e1' }
      }),
      dropdownIndicator: (base, state) => ({
        ...base,
        color: '#444', // Blue when active, Slate-400 when not
        transition: 'all 0.2s ease',
      }),
      option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? '#1976D2' : state.isFocused ? '#eff6ff' : 'white',
        color: state.isSelected ? 'white' : state.isFocused ? '#1976D2' : '#475569',
        fontWeight: 'bold',
        fontSize: '20px',
        '&:active': { backgroundColor: '#1976D2' }
      }),
      
        menuPortal: (base) => ({ 
            ...base, 
            zIndex: 9999 
        }),
    };

    const handleSubmit = () => {
        if (mode === 'custom') {
            if (!newItem.name.trim()) return;
            // Map 'other' to empty string to match your existing data logic
            const formattedItem = { 
                ...newItem, 
                type: newItem.type === 'other' ? '' : newItem.type,
                crossed: false 
            };
            onAdd(formattedItem);
        } else if (mode === 'recipe') {
            // add recipe to list
            // count duplicate recipes duplicateCount in recipe
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
            

            // increment duplicate count and push to recipe.ingredients
        }
        
        setNewItem({ name: '', amount: '1', type: 'other' });
        setMode('custom');
    };
    
    const onCancel = (e) => {
        setNewItem({ name: '', amount: '1', type: 'other' });
        setMode('custom');
        onClose(e);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header with Tab Switcher */}
                <div className="bg-[#1976D2] p-6 text-white text-center">
                    <div className="flex bg-blue-700/50 rounded-xl p-1 mb-3">
                        <button 
                            onClick={() => setMode('custom')}
                            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${mode === 'custom' ? 'bg-white text-[#1976D2] shadow-sm' : 'text-white/70'}`}
                        >
                            Custom
                        </button>
                        <button 
                            onClick={() => setMode('recipe')}
                            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${mode === 'recipe' ? 'bg-white text-[#1976D2] shadow-sm' : 'text-white/70'}`}
                        >
                            Recipe
                        </button>
                    </div>
                    <div className="text-center">
                        <FontAwesomeIcon icon={mode === 'custom' ? faPlus : faUtensils} className="text-2xl mb-2" />
                        <h3 className="text-lg font-bold uppercase tracking-widest">
                            {mode === 'custom' ? 'Add Custom Item' : 'Add Recipe Ingredients'}
                        </h3>
                    </div>
                </div>
                
                <div className="p-6 space-y-4">
                {mode === 'custom' ? (
                    <>
                    <div>
                        <label className="text-[14px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Aisle / Category</label>
                        <div className="relative">
                            <Select
                                styles={selectStyles}
                                options={aisles.map(a => { return { value: a, label: a.toUpperCase() } })}
                                onChange={(target) => setNewItem({...newItem, type: target.value})}
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="w-1/3">
                            <label className="text-[14px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Amount</label>
                            <input 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-[#1976D2]"
                                placeholder="1"
                                value={newItem.amount}
                                onChange={(e) => setNewItem({...newItem, amount: e.target.value})}
                            />
                        </div>
                        <div className="w-2/3">
                            <label className="text-[14px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Ingredient</label>
                            <input 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-[#1976D2]"
                                placeholder="Milk"
                                value={newItem.name}
                                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                                autoFocus
                            />
                        </div>
                    </div>
                    </>
                ) : 
                    <div className="">
                        <label className="text-[14px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Select Recipe</label>
                        <div className="relative">
                            <Select
                                styles={selectStyles}
                                options={recipeOptions}
                                formatOptionLabel={({ label, isFavorite }) => (
                                    <div className="flex items-center">
                                        {isFavorite && (
                                        <FontAwesomeIcon 
                                            icon={faBookmark} 
                                            className="text-amber-600 mr-2 text-sm" 
                                        />
                                        )}
                                        <span>{label}</span>
                                    </div>
                                )}
                                onChange={(target) => setSelectedRecipeId(target.value)}
                            />
                        </div>
                    </div>
                }

                    <div className="flex gap-3 pt-2">
                        <button onClick={onCancel} className="flex-1 py-3 font-bold text-slate-400 uppercase text-xs tracking-widest">Cancel</button>
                        <button onClick={handleSubmit} className="flex-1 py-3 bg-[#1976D2] text-white rounded-xl font-bold shadow-lg uppercase text-xs tracking-widest">
                            Add to List
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddIngredientModal;