import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { nanoid } from '@reduxjs/toolkit';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';

import { addGroceryListToFirestore } from '../slices/groceryListsSlice.ts';
import { formatDate, formatTime } from '../../../services/date.js';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTrash, 
  faHeart as faHeartSolid, 
  faPlus, 
  faShoppingCart, 
  faSave, 
  faCalendarAlt,
  faUtensils,
  faCheck 
} from '@fortawesome/free-solid-svg-icons';

import GroceryRecipeListItem from '../components/GroceryRecipeListItem.js';

const AddGroceryList = (props) => {
  const { user } = props;
  const userId = user.uid;

  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { allRecipes, favoriteRecipes } = useSelector(state => state.recipes);
  const combinedRecipes = Array.from(
    new Map([...allRecipes, ...favoriteRecipes].map(r => [r.fbid || r.id, r])).values()
  ).sort((a, b) => a.name_lowercase.localeCompare(b.name_lowercase));

  const recipeOptions = combinedRecipes && combinedRecipes.map((recipe) => ({
    value: recipe.id,
    label: recipe.name,
    isFavorite: recipe.favorited
  }));

  let allRecipesById = {};
  combinedRecipes && combinedRecipes.forEach(function(r) {
    allRecipesById[r.id] = r;
  });

  const [recipes, setRecipes] = useState([]); 
  const [ingredients, setIngredients] = useState([]); 

  // --- HANDLERS (Functionality Unchanged) ---
  const handleAddIngredient = () => setIngredients([...ingredients, { amount: '', name: '', type: '' }]);
  const handleRemoveIngredient = (index) => {
    const newIngredients = [...ingredients];
    newIngredients.splice(index, 1);
    setIngredients(newIngredients);
  };
  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const customIsZero = ingredients.length === 0;
  const customHasUnfilled = ingredients && ingredients.some(ingredient => ingredient.amount === "" || ingredient.name.trim() === "");
  const recipesAreZero = recipes.length === 0 || (recipes && recipes.every((r) => !r.recipe.ingredients.length));
  const isSaveDisabled = (customIsZero && recipesAreZero) || customHasUnfilled;
  
  const handleSave = async () => {
    if (!isSaveDisabled) {
      try {
        await dispatch(addGroceryListToFirestore({ 
            id: nanoid(), 
            userId, 
            recipes, 
            ingredients, 
            timestamp: (new Date()).getTime() 
        }));
        navigate('/grocery-lists');
      } catch (error) { console.error("Failed to save:", error); }
    }
  };

  const typeOptions = [
    { value: '', label: 'Other' },
    { value: 'dairy', label: 'Dairy' },
    { value: 'freezer', label: 'Freezer' },
    { value: 'meat', label: 'Meat' },
    { value: 'produce', label: 'Produce' },
  ];

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: '#F8FAFC',
      border: state.isFocused ? '1px solid #1976D2' : '1px solid #E2E8F0',
      borderRadius: '12px',
      padding: '4px',
      boxShadow: 'none',
      '&:hover': { borderColor: '#1976D2' }
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#1976D2' : state.isFocused ? '#EFF6FF' : 'white',
      color: state.isSelected ? 'white' : '#1E293B',
      fontWeight: '600'
    })
  };

  return (
    <main className="max-w-xl mx-auto min-w-[380px] p-6 pb-40">
      
      {/* 1. HEADER (Matches View Page) */}
      <div className="flex flex-col gap-4 mb-8 px-1">
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-4">
            <h1 className="text-left text-2xl font-bold text-slate-800 leading-tight">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-lg mb-0.5 text-slate-600" />
              <span> New Grocery List</span>          
            </h1>
            <div className="flex items-center gap-2 text-slate-400 mt-1">
              <span className="text-[16px] font-black uppercase tracking-[0.2em]">
                {formatDate(new Date())}
              </span>
            </div>
          </div>
        </div>

        {/* 2. RECIPE SEARCH BAR */}
        <div className="mt-2">
          <div className="flex items-center gap-2 text-slate-600 mb-3 ml-1">
            <FontAwesomeIcon icon={faUtensils} className="text-md" />
            <span className="text-md font-black uppercase tracking-widest text-slate-800">Add Recipes</span>
          </div>
          <Select
            isMulti
            options={recipeOptions}
            styles={customSelectStyles}
            placeholder="Search for a recipe..."
            formatOptionLabel={({ label, isFavorite }) => (
              <div className="flex items-center justify-between">
                <span className="font-bold">{label}</span>
                {isFavorite && <FontAwesomeIcon icon={faHeartSolid} className="text-red-500 text-xs" />}
              </div>
            )}
            onChange={(selectedOptions) => {
              const updateSavedRecipes = (selectedOptions || []).map(option => {
                const existing = recipes.find(r => r.id === option.value);
                return existing || { id: option.value, recipe: allRecipesById[option.value] };
              });
              setRecipes(updateSavedRecipes);
            }}
          />
        </div>

        {/* 3. SELECTED RECIPE TAGS (Matches View Page Style) */}
        {recipes.length > 0 && (
          <div className="flex flex-wrap gap-2 pl-1 mt-2 animate-in slide-in-from-top-2 duration-300">
            {recipes.map((r, i) => (
              <span key={i} className="text-[14px] font-bold text-[#1976D2] bg-blue-50/50 px-3 py-1.5 rounded-xl border border-blue-100/50 uppercase tracking-tight shadow-sm flex items-center gap-2">
                {r.recipe.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 4. THE "PAPER" LIST CONTAINER */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 relative overflow-hidden mb-6">
        
        {/* Notebook Margin Line */}
        <div className="absolute left-14 top-0 bottom-0 w-px bg-red-300/40 z-30 pointer-events-none" />

        {/* SECTION: MANUAL ITEMS */}
        <section className="relative z-10">
          <div className="bg-slate-200/90 px-16 py-2.5 border-b border-slate-300/50">
            <h2 className="text-[14px] font-black uppercase tracking-[0.4em] text-slate-600">Manual Items</h2>
          </div>
          
          <div className="divide-y divide-slate-200/40">
            {ingredients.length === 0 ? (
              <div className="px-16 py-10 text-slate-400 italic text-sm">
                No custom items added yet...
              </div>
            ) : (
              ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-stretch group bg-white animate-in fade-in duration-300">
                  {/* Remove Button Zone (where checkmark usually is) */}
                  <button 
                    onClick={() => handleRemoveIngredient(index)}
                    className="w-14 shrink-0 flex items-center justify-center bg-slate-50 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                  </button>

                  {/* Input Zone */}
                  <div className="flex-1 flex flex-col sm:flex-row items-center gap-3 pl-5 pr-4 py-4">
                    <input
                      type="text"
                      placeholder="Qty"
                      className="w-full sm:w-20 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-[#1976D2] outline-none focus:border-[#1976D2]"
                      value={ingredient.amount}
                      onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Ingredient name..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-[#1976D2]"
                      value={ingredient.name}
                      onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                    />
                    <div className="w-full sm:w-40">
                      <Select
                        placeholder="Aisle..."
                        styles={customSelectStyles}
                        options={typeOptions}
                        value={typeOptions.find(opt => opt.value === ingredient.type)}
                        onChange={(opt) => handleIngredientChange(index, 'type', opt.value)}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* 5. FLOATING ADD BUTTON */}
      <button 
        onClick={handleAddIngredient}
        className="fixed bottom-28 right-6 w-16 h-16 rounded-full bg-[#1976D2] text-white shadow-2xl flex items-center justify-center hover:bg-blue-700 transition-all active:scale-90 z-40"
      >
        <FontAwesomeIcon icon={faPlus} className="text-2xl" />
      </button>

      {/* 6. FULL-WIDTH STICKY SAVE BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 z-50">
        <div className="max-w-xl mx-auto flex gap-4">
          <button 
            onClick={() => navigate('/grocery-lists')} 
            className="flex-1 py-4 font-black uppercase text-[12px] tracking-widest text-slate-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaveDisabled}
            className={`flex-[2] py-4 rounded-2xl flex items-center justify-center gap-3 transition-all
              ${isSaveDisabled 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 active:scale-[0.98]'
              }`}
          >
            <FontAwesomeIcon icon={faCheck} />
            <span className="font-black uppercase tracking-[0.2em] text-sm">Create List</span>
          </button>
        </div>
      </div>

    </main>
  );
};

export default AddGroceryList;