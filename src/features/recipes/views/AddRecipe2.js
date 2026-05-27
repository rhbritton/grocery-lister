import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';

import EditIngredient from '../components/EditIngredient2';

import { getAuth } from 'firebase/auth';

import { addRecipe, addRecipeToFirestore } from '../slices/recipesSlice.ts';

import recipesConfig from '../config.json';

import { createReactSelectStyles, REACT_SELECT_MENU_Z_INDEX } from '../../../utils/reactSelectStyles.js';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSave, 
  faPlus, 
  faListUl, 
  faMortarPestle
} from '@fortawesome/free-solid-svg-icons';

const AddRecipe = (props) => {
  const { user } = props;
  const userId = user.uid;

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState([{ amount: '1', name: '', type: '' }]);
  const [instructions, setInstructions] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { amount: '1', name: '', type: '' }]);
  };

  const handleRemoveIngredient = (index) => {
    const newIngredients = [...ingredients];
    newIngredients.splice(index, 1);
    setIngredients(newIngredients);
  };

  const handleIngredientChange = (index, field, value) => {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    );
  };

  const selectStyles = createReactSelectStyles({
    fontSize: '20px',
    multiValueLabelSize: '20px',
    menuPortalZIndex: REACT_SELECT_MENU_Z_INDEX,
  });

  const handleSave = async () => {
    if (name.trim() !== '' && ingredients.length > 0 && ingredients.every(ingredient => ingredient.amount !== "" && ingredient.name.trim() !== "")) {
      setIsSaving(true);
      try {
        await dispatch(addRecipeToFirestore({ 
            userId, name, ingredients, instructions
        }));

        setName('');
        setIngredients([{ amount: '1', name: '', type: '' }]);
        setInstructions('');
        
        navigate('/recipes');
      } catch (error) {
        console.error("Failed to save recipe:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCancel = () => {
    setName('');
    setIngredients([{ amount: '1', name: '', type: '' }]);
    setInstructions('');

    navigate('/recipes');
  };

  const isSaveDisabled = name.trim() === '' || ingredients.length === 0 || ingredients.some(ingredient => ingredient.amount === "" || ingredient.name.trim() === "") || isSaving;

  let options = [{ value: 'reset', label: '--- Clear All ---' }];

  
  const { allRecipes, allRecipesSorted } = useSelector(state => state.recipes);

  const getRecipeById = (id) => {
    let recipe;
    allRecipesSorted.some((r) => {
        if (r.id === id) {
            recipe = r;
            return true;
        }
    });

    return recipe;
  }

  const getConfigRecipeById = (id) => {
    let recipe;
    recipesConfig.recipes.some((r) => {
        if (r.id == id) {
            recipe = r;
            return true;
        }
    });

    return recipe;
  }
  
  options = options.concat(allRecipesSorted.map((recipe, index) => ({
    value: recipe.id,
    label: recipe.name,
  })));

    options = options.concat(recipesConfig.recipes.sort((a, b) => {
        if (a.name.toLowerCase() > b.name.toLowerCase()) 
            return 1;
        else
            return -1;
    }).map((recipe, index) => ({
        value: recipe.id,
        label: recipe.name,
        isConfig: true
    })));

    const formatOptionLabel = ({ label, isConfig, value }) => (
        <div className="flex items-center justify-start gap-3">
            {isConfig && value !== 'reset' ? (
                <img 
                    src={`${process.env.PUBLIC_URL}/logo192.png`}
                    alt="GroceryLister Logo" 
                    className="h-5 w-5 object-contain opacity-90" 
                />
            ) : (
                <div className="w-5" /> 
            )}
            
            <span className="font-medium text-slate-700">{label}</span>
        </div>
    );

  const typeOptions = [
    { value: '', label: 'Other'  },
    { value: 'dairy', label: 'Dairy' },
    { value: 'freezer', label: 'Freezer' },
    { value: 'meat', label: 'Meat' },
    { value: 'produce', label: 'Produce' },
  ]
  
  const findSelectedOption = (value) => {
    let selectedOption;
    typeOptions.some((opt) => {
      if (opt.value == value) {
        selectedOption = opt;
        return true;
      }
    });

    return selectedOption;
  };

  return (
    <main className="page-main pb-bar-clear space-y-6">

        <div className="mb-4">
            <label htmlFor="recipeName" className="block font-medium text-gray-700">
                Prefill With Recipe:
            </label>
            <Select
                options={options}
                styles={selectStyles}
                formatOptionLabel={formatOptionLabel}
                onChange={(selectedOption) => {
                    if (selectedOption && selectedOption.value !== 'reset') {
                        const configRecipe = getConfigRecipeById(selectedOption.value)
                        if (configRecipe) {
                            setName(configRecipe.name);
                            setIngredients(configRecipe.ingredients.map((ing) => ({ ...ing })));
                            setInstructions(configRecipe.instructions);
                        } else {
                            const recipeId = selectedOption.value;
                            const recipe = getRecipeById(recipeId);
                            setName(recipe.name);
                            setIngredients(recipe.ingredients.map((ing) => ({ ...ing })));
                            setInstructions(recipe.instructions);
                        }
                    } else {
                        setName('');
                        setIngredients([]);
                        setInstructions('');
                    }
                }}
            />
        </div>
        
        {/* Basic Info Card */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
            {/* Consistency Accent Line */}
            <div className="h-1 bg-brand" />

            <div className="p-6 space-y-5">
                {/* Recipe Name Field */}
                <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                        Recipe Name
                    </label>
                    <input 
                        type="text"
                        id="recipeName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full text-xl font-bold text-slate-800 border-b-2 border-slate-300 focus:border-brand outline-none pb-1 transition-all"
                        placeholder="Enter recipe name..."
                    />
                </div>

                {/* Metadata Row: Time and Category */}
                <div className="flex flex-col sm:flex-row gap-6 pt-2"> {/* Added pt-2 so the top label has room */}

                    {/* Time (Mins) Field */}
                    {/* <div className="flex-1 relative">
                        <label className="absolute -top-2 left-3 px-1 bg-white z-10 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faClock} className="text-[9px]" /> Time (Mins)
                        </label>
                        <input 
                            type="number" 
                            value={recipe.prepTime}
                            onChange={(e) => setRecipe({...recipe, prepTime: e.target.value})}
                            className="w-full bg-[#f8fafc] rounded-xl px-4 py-3 text-base font-bold border outline-none transition-all focus:border-brand focus:ring-4 focus:ring-blue-500/10 focus:bg-white"
                        />
                    </div> */}

                    {/* Category Field */}
                    {/* <div className="flex-1 relative">
                        <label className="absolute -top-2 left-3 px-1 bg-white z-10 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faTag} className="text-[9px]" /> Category
                        </label>
                        <Select 
                            options={categoryOptions}
                            value={recipe.category}
                            onChange={(option) => setRecipe({...recipe, category: option})}
                            styles={selectStyles}
                            menuPortalTarget={document.body} 
                            menuPosition="fixed"
                        />
                    </div> */}
                </div>
            </div>
        </section>

        {/* Ingredients Section (Dynamic List) */}
        <section className="bg-white rounded-3xl shadow-md border border-slate-200 overflow-visible">
            <div className="h-1 bg-brand rounded-t-3xl" />

            <div className="p-6">
                {/* Section Header - Simple & Clean */}
                <div className="flex items-center gap-2 mb-6">
                    <FontAwesomeIcon icon={faListUl} className="text-brand" />
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">
                        Ingredients
                    </h2>
                </div>

                {/* Ingredients List */}
                <div className="flex flex-col">
                    {ingredients.map((ingredient, index) => (
                        <EditIngredient 
                            key={index}
                            ingredient={ingredient} 
                            index={index} 
                            typeOptions={typeOptions}
                            handleIngredientChange={handleIngredientChange}
                            handleRemoveIngredient={handleRemoveIngredient}
                            findSelectedOption={findSelectedOption}
                        />
                    ))}
                </div>

                {/* 3. Thumb-Friendly Add Button at the bottom */}
                <div className="mt-8">
                    <button 
                        onClick={handleAddIngredient}
                        className="w-full bg-blue-50 text-brand py-4 rounded-2xl font-bold text-xs uppercase tracking-widest border-2 border-dashed border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        Add Ingredient
                    </button>
                </div>
            </div>
        </section>

        {/* Instructions Section (Large Textarea) */}
        <section className="bg-white rounded-3xl shadow-md border border-slate-200 overflow-hidden">
            <div className="h-1 bg-brand" />
            <div className="p-6 text-left">
                <div className="flex items-center gap-2 mb-4">
                    <FontAwesomeIcon icon={faMortarPestle} className="text-brand" />
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-800 text-left">Steps</h2>
                </div>
                
                <textarea 
                    id="instructions" 
                    className="w-full bg-slate-50 rounded-2xl p-4 text-base leading-relaxed border outline-none transition-all resize-none font-medium text-slate-700"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)} 
                    rows="12"
                    placeholder="Enter your steps here..."

                />
            </div>
          
            <p className="mb-10 mt-3 ml-6 mr-6 text-sm text-slate-400 font-medium italic px-1">
                Tip: Press Enter for new lines. These will appear as separate steps in the view mode.
            </p>
        </section>

        <div className="bottom-bar">
            <div className="max-w-xl mx-auto flex gap-4">
                <button 
                    onClick={handleCancel} 
                    className="flex-1 py-4 min-h-touch font-black uppercase text-label tracking-widest text-slate-400"
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
                <FontAwesomeIcon icon={faSave} />
                <span className="font-black uppercase tracking-[0.2em] text-sm">{isSaving ? 'Saving…' : 'Create Recipe'}</span>
                </button>
            </div>
        </div>

      </main>
  );
};

export default AddRecipe;