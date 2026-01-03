import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, NavLink } from 'react-router-dom';

import EditIngredient from '../components/EditIngredient2';

import { fetchRecipeById } from '../slices/recipeSlice.ts';
import { editRecipe, editRecipeFromFirestore } from '../slices/recipesSlice.ts';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSave, 
  faPlus, 
  faListUl, 
  faMortarPestle
} from '@fortawesome/free-solid-svg-icons';

const EditRecipe = () => {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState([{ amount: '1', name: '', type: '' }]);
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        let recipe = (await dispatch(fetchRecipeById(recipeId))).payload;

        if (recipe) {
          setName(recipe.name || '');
          setIngredients(recipe.ingredients || []);
          setInstructions(recipe.instructions || '');
        }

      } catch (error) {
        console.error("Error fetching recipe:", error);
      }
    }

    fetchData();
  }, [dispatch, recipeId]);



  const handleAddIngredient = () => {
    setIngredients([...ingredients, { amount: '1', name: '', type: '' }]);
  };

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

  const handleSave = () => {
    if (name.trim() !== '' && ingredients.length > 0 && ingredients.every(ingredient => ingredient.amount !== "" && ingredient.name.trim() !== "")) {
      dispatch(editRecipeFromFirestore({ fbid: recipeId, name, ingredients, instructions }));
      setName('');
      setIngredients([{ amount: '1', name: '', type: '' }]);
      setInstructions('');
      
      navigate('/recipes');
    }
  };

  const handleCancel = () => {
    setName('');
    setIngredients([{ amount: '1', name: '', type: '' }]);
    setInstructions('');

    navigate('/recipes');
  };

  const isSaveDisabled = name.trim() === '' || ingredients.length === 0 || ingredients.some(ingredient => ingredient.amount === "" || ingredient.name.trim() === "");

  const typeOptions = [
    { value: '', label: 'Other'  },
    { value: 'dairy', label: 'Dairy' },
    { value: 'freezer', label: 'Freezer' },
    { value: 'meat', label: 'Meat' },
    { value: 'produce', label: 'Produce' },
  ];

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
    <main className="max-w-xl mx-auto p-6 space-y-6">
        
        {/* Basic Info Card */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
            {/* Consistency Accent Line */}
            <div className="h-1 bg-[#1976D2]" />

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
                        className="w-full text-xl font-bold text-slate-800 border-b-2 border-slate-300 focus:border-[#1976D2] outline-none pb-1 transition-all"
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
                            className="w-full bg-[#f8fafc] rounded-xl px-4 py-3 text-base font-bold border outline-none transition-all focus:border-[#1976D2] focus:ring-4 focus:ring-blue-500/10 focus:bg-white"
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
        <section className="bg-white rounded-3xl shadow-md border border-slate-200 overflow-hidden">
            <div className="h-1 bg-[#1976D2]" />

            <div className="p-6">
                {/* Section Header - Simple & Clean */}
                <div className="flex items-center gap-2 mb-6">
                    <FontAwesomeIcon icon={faListUl} className="text-[#1976D2]" />
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
                        className="w-full bg-blue-50 text-[#1976D2] py-4 rounded-2xl font-bold text-xs uppercase tracking-widest border-2 border-dashed border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        Add Ingredient
                    </button>
                </div>
            </div>
        </section>

        {/* Instructions Section (Large Textarea) */}
        <section className="bg-white rounded-3xl shadow-md border border-slate-200 overflow-hidden">
            <div className="h-1 bg-[#1976D2]" />
            <div className="p-6 text-left">
                <div className="flex items-center gap-2 mb-4">
                    <FontAwesomeIcon icon={faMortarPestle} className="text-[#1976D2]" />
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
          
            {/* Optional: Footer Tip */}
            <p className="mb-10 mt-3 ml-6 mr-6 text-sm text-slate-400 font-medium italic px-1">
                Tip: Press Enter for new lines. These will appear as separate steps in the view mode.
            </p>
        </section>

        
        {/* Primary Floating Action Button */}
        <button 
            onClick={handleSave}
            disabled={isSaveDisabled}
            className={`fixed bottom-6 right-6 w-16 h-16 bg-[#1976D2] rounded-2xl shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center transform z-50
                ${(isSaveDisabled) 
                    ? 'bg-slate-300 text-slate-500 hover:bg-slate-300 cursor-not-allowed shadow-none' 
                    : 'bg-[#1976D2] text-white shadow-2xl hover:bg-blue-700 transform active:scale-95'
                }`
            }
        >
            <FontAwesomeIcon icon={faSave} className="text-2xl" />
        </button>

      </main>
  );
};

export default EditRecipe;