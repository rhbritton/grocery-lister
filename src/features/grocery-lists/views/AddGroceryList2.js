import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { nanoid } from '@reduxjs/toolkit';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';

import { getAuth } from 'firebase/auth';

import { addGroceryList, addGroceryListToFirestore } from '../slices/groceryListsSlice.ts';

import store from 'store2';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTrash,
    faBookmark,
    faCalendarAlt,
    faUtensils,
    faPlus,
    faCheck,
    faHashtag,
    faTag
} from '@fortawesome/free-solid-svg-icons';

import { fetchRecipes, selectRecipes, searchRecipes, getAllRecipes, getAllRecipesFromFirestore } from '../../recipes/slices/recipesSlice.ts';

import recipesConfig from '../../recipes/config.json';

import GroceryRecipeListItem from '../components/GroceryRecipeListItem2.js';

import { formatDate, formatTime } from '../../../services/date.js';

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
      multiValue: (base) => ({
        ...base,
        backgroundColor: '#eff6ff', // bg-blue-50
        borderRadius: '0.5rem',
      }),
      multiValueLabel: (base) => ({
        ...base,
        color: '#1976D2',
        fontWeight: '700',
        fontSize: '20px',
      }),
      multiValueRemove: (base) => ({
        ...base,
        color: '#1976D2',
        '&:hover': {
          backgroundColor: '#1976D2',
          color: 'white',
          borderRadius: '0.5rem',
        },
      }),
      option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? '#1976D2' : state.isFocused ? '#eff6ff' : 'white',
        color: state.isSelected ? 'white' : state.isFocused ? '#1976D2' : '#475569',
        fontWeight: 'bold',
        fontSize: '20px',
        '&:active': { backgroundColor: '#1976D2' }
      }),
    };

    const aisleStyles = {
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
  multiValue: (base) => ({
    ...base,
    backgroundColor: '#eff6ff', // bg-blue-50
    borderRadius: '0.5rem',
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#1976D2',
    fontWeight: '700',
    fontSize: '14px',
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#1976D2',
    '&:hover': {
      backgroundColor: '#1976D2',
      color: 'white',
      borderRadius: '0.5rem',
    },
  }),
  singleValue: (base) => ({
    ...base,
    fontSize: '14px', // Set your desired size here
    fontWeight: 'bold',
    color: '#1e293b',
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#1976D2' : state.isFocused ? '#eff6ff' : 'white',
    color: state.isSelected ? 'white' : state.isFocused ? '#1976D2' : '#475569',
    fontWeight: 'bold',
    fontSize: '14px',
    '&:active': { backgroundColor: '#1976D2' }
  }),
  placeholder: (base) => ({
    ...base,
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#94a3b8',
  }),
  input: (base) => ({
    ...base,
    fontSize: '14px',
  }),
    

  menuPortal: (base) => ({ 
    ...base, 
    zIndex: 9999 
  }),

  // 2. Give the menu a solid background and a clean shadow
  menu: (base) => ({
    ...base,
    backgroundColor: 'white', // This prevents labels from showing through
    zIndex: 9999,
    borderRadius: '1rem',
    marginTop: '4px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  }),

  // 3. Ensure the list inside the menu is also opaque
  menuList: (base) => ({
    ...base,
    backgroundColor: 'white',
    borderRadius: '1rem',
  })
  };


  // useEffect(() => {
  //   if (!allRecipes || allRecipes.length === 0) {
  //       dispatch(getAllRecipesFromFirestore(userId));
  //   }
  // }, [dispatch, allRecipes]);

  let allRecipesById = {};
  combinedRecipes && combinedRecipes.forEach(function(r) {
    allRecipesById[r.id] = r;
  });

  const [recipes, setRecipes] = useState([]); // { id: nano(), recipe: {} }
  const [ingredients, setIngredients] = useState([]); // { amount: '', name: '', type: '', recipeId: '' }

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { amount: '1', name: '', type: '' }]);
  };

  const handleRemoveIngredient = (index) => {
    const newIngredients = [...ingredients];
    newIngredients.splice(index, 1);
    setIngredients(newIngredients);
  };

  const handleRecipeChange = (index, field, value) => {
    const newRecipes = [...ingredients];
    newRecipes[index][field] = value;
    setIngredients(newRecipes);
  }

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const customIsZero = ingredients.length === 0;
  const customHasUnfilled = ingredients && ingredients.some(ingredient => ingredient.amount === "" || ingredient.name.trim() === "");
  
  const recipesAreZero = recipes.length === 0 || (recipes && recipes.every((r) => {
    console.log(r)
    return !r.recipe.ingredients.length;
  }));
  const recipesAreAllCrossed = recipes && recipes.every((r) => {
    return r.recipe.ingredients.every((ing) => {
      return ing.crossed;
    });
  });

  const isSaveDisabled = (customIsZero && recipesAreZero) || customHasUnfilled || (recipesAreAllCrossed && customIsZero);
  
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

        setRecipes([]);
        setIngredients([]);
        navigate('/grocery-lists');
      } catch (error) {
        console.error("Failed to save grocery list:", error);
      }
    }
  };

  const handleCancel = () => {
    setRecipes([]);
    setIngredients([]);

    navigate('/grocery-lists');
  };

  const typeOptions = [
    { value: '', label: 'Other' },
    { value: 'dairy', label: 'Dairy' },
    { value: 'freezer', label: 'Freezer' },
    { value: 'meat', label: 'Meat' },
    { value: 'produce', label: 'Produce' },
  ];

  const dateStr = formatDate(new Date());
  const timeStr = formatTime(new Date(), { hour: 'numeric', minute: 'numeric'});

  return (
    <main className="max-w-xl mx-auto min-w-[380px] p-6 pb-40">
      
      {/* 1. HEADER (Matches View Page) */}
      <div className="flex flex-col gap-4 mb-8 px-1">
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-4">
            <h1 className="text-left text-2xl font-bold text-slate-800 leading-tight">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-lg mb-0.5 text-slate-600" />
              <span> {dateStr}</span>          
            </h1>
            <div className="flex items-center gap-2 text-slate-400 mt-1">
              <span className="text-[16px] font-black uppercase tracking-[0.2em]">
                {timeStr}
              </span>
            </div>
          </div>
        </div>

        {/* 2. RECIPE SEARCH BAR */}
        <div className="mt-2 z-50">
          <div className="flex items-center gap-2 text-slate-600 mb-3 ml-1">
            <FontAwesomeIcon icon={faUtensils} className="text-md" />
            <span className="text-md font-black uppercase tracking-widest text-slate-800">Add Recipes</span>
          </div>
          <Select
            isMulti
            options={recipeOptions}
            styles={selectStyles}
            placeholder="Search for a recipe..."
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
            onChange={(selectedOptions) => {
                if (selectedOptions && selectedOptions.length) {
                    let updateSavedRecipes = [];
                    selectedOptions.forEach(function(option) {
                    let alreadySaved = recipes.some(function(savedRecipe) {
                        if (savedRecipe.id == option.value) {
                        updateSavedRecipes.push(savedRecipe)
                        return true;
                        }
                    });

                    if (!alreadySaved) {
                        updateSavedRecipes.push({ id: option.value, recipe: allRecipesById[option.value] })
                    }
                    });

                    setRecipes(updateSavedRecipes);
                } else {
                    setRecipes([]);
                }
            }}
          />
        </div>

        {/* 3. SELECTED RECIPE TAGS (Matches View Page Style) */}
        {recipes.length > 0 && (
          <div className="flex flex-wrap gap-2 pl-1 mt-2 animate-in slide-in-from-top-2 duration-300">
            {recipes.map((r, i) => (
              <GroceryRecipeListItem key={r.recipe.fbid+r.recipe.id+i} recipe={r} setRecipes={setRecipes} recipes={recipes} />
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
            <h2 className="text-[14px] font-black uppercase tracking-[0.4em] text-slate-600">Custom Items</h2>
          </div>
          
          <div className="divide-y divide-slate-200/40">
            {ingredients.length === 0 ? (
              <div className="px-16 py-10 text-slate-400 italic text-sm">
                No custom items added yet...
              </div>
            ) : (
              ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-stretch group bg-white animate-in fade-in slide-in-from-top-2 duration-300">
          
          {/* 1. MARGIN ZONE: Trash Button */}
          <div className="w-14 shrink-0 flex items-center justify-center border-r border-transparent">
            <button 
              onClick={() => handleRemoveIngredient(index)}
              className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
            >
              <FontAwesomeIcon icon={faTrash} className="text-sm" />
            </button>
          </div>

          {/* 2. WRITING ZONE: Styled Inputs with Floating Labels */}
          <div className="flex-1 flex flex-col gap-6 pl-6 pr-6 py-8">
            
            {/* Row 1: Qty and Aisle */}
            <div className="flex gap-3">
              {/* Qty Field */}
              <div className="w-24 shrink-0 relative">
                <label className="absolute -top-2 left-3 px-1 bg-white z-10 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                  <FontAwesomeIcon icon={faHashtag} className="text-[8px]" /> Qty
                </label>
                <input 
                  type="text"
                  value={ingredient.amount}
                  onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                  className="w-full bg-[#f8fafc] rounded-xl px-4 py-2 text-[14px] font-bold border border-slate-500 outline-none transition-all focus:border-[#1976D2] focus:ring-4 focus:ring-blue-500/10 focus:bg-white"
                  placeholder="1"
                />
              </div>

              {/* Aisle Field */}
              <div className="flex-1 relative">
                <label className="absolute -top-2 left-3 px-1 bg-white z-10 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                  <FontAwesomeIcon icon={faTag} className="text-[8px]" /> Aisle
                </label>
                <Select 
                  options={typeOptions}
                  value={typeOptions.find(opt => opt.value === ingredient.type)}
                  onChange={(opt) => handleIngredientChange(index, 'type', opt.value)}
                  styles={aisleStyles} // Uses the detailed styles you shared
                  menuPortalTarget={document.body} 
                  menuPosition="fixed"
                />
              </div>
            </div>

            {/* Row 2: Name Field */}
            <div className="w-full relative">
              <label className="absolute -top-2 left-3 px-1 bg-white z-10 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                <FontAwesomeIcon icon={faUtensils} className="text-[8px]" /> Name
              </label>
              <input 
                type="text" 
                value={ingredient.name}
                onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                className="w-full bg-[#f8fafc] rounded-xl px-4 py-2 text-[14px] font-bold border border-slate-500 outline-none transition-all focus:border-[#1976D2] focus:ring-4 focus:ring-blue-500/10 focus:bg-white"
                placeholder="Item name..."
              />
            </div>
          </div>

        </div>
              ))
            )}
          </div>

          {/* THE ADD BUTTON "ROW" */}
          <div className="flex items-stretch border-t border-slate-200/40 bg-slate-50/30">
              {/* 1. This empty div maintains the "Margin Zone" to the left of the red line */}
              <div className="w-14 shrink-0" />

              {/* 2. The Button sits entirely in the "Writing Zone" */}
              <div className="flex-1 p-4 pr-6">
                  <button 
                      onClick={handleAddIngredient}
                          className="w-full bg-blue-50 text-[#1976D2] py-4 rounded-2xl font-bold text-xs uppercase tracking-widest border-2 border-dashed border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            
                  >
                      <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
                      Add Custom Item
                  </button>
              </div>
          </div>
          
        </section>
      </div>

      {/* 6. FULL-WIDTH STICKY SAVE BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 z-50">
        <div className="max-w-xl mx-auto flex gap-4">
          <button 
            onClick={handleCancel} 
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