import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, NavLink, useSearchParams } from 'react-router-dom';
import Select from 'react-select';

import pako from 'pako';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faTrash } from '@fortawesome/free-solid-svg-icons';

import { fetchGroceryListById } from '../slices/groceryListSlice.ts';
import { editGroceryList, editGroceryListFromFirestore } from '../slices/groceryListsSlice.ts';

import { formatDate, formatTime } from '../../../services/date.js';

import GroceryListEditItem from '../components/GroceryListEditItem.js';

const groceryListRecipeSeparator = ', ';

const ViewGroceryList = () => {
  const { groceryListId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [groceryList, setGroceryList] = useState(undefined);
  const [originalAllIngredients, setOriginalAllIngredients] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);

  const [ingredients, setIngredients] = useState([]); // { amount: '', name: '', type: '', recipeId: '' }
  
    const typeOptions = [
        { value: '', label: 'Other' },
        { value: 'dairy', label: 'Dairy' },
        { value: 'freezer', label: 'Freezer' },
        { value: 'meat', label: 'Meat' },
        { value: 'produce', label: 'Produce' },
    ]

    const handleAddIngredient = () => {
        setIngredients([...ingredients, { amount: '', name: '', type: '' }]);
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

  function getAllIngredientsByType(all_ingredients) {
    let all_ingredients_by_type = {};
    all_ingredients.forEach(function(ing) {
        let type = ing && ing.ingredient && ing.ingredient.type;
        if (!type)
            type = '';

        if (!all_ingredients_by_type[type])
            all_ingredients_by_type[type] = [];

        all_ingredients_by_type[type].push(ing);
    });

    Object.keys(all_ingredients_by_type).forEach(function(key) {
        all_ingredients_by_type[key].sort((a, b) => {
            if (a.ingredient.name.toLowerCase() > b.ingredient.name.toLowerCase()) {
                return 1;
            } else if (a.ingredient.name.toLowerCase() < b.ingredient.name.toLowerCase()) {
                return -1;
            } else {
                if (a.ingredient.amount.toLowerCase() > b.ingredient.amount.toLowerCase())
                    return -1;
                else
                    return 1;
            }
        });
    });

    return all_ingredients_by_type;
  }

  function getAllIngredients(gl) {
    let all_ingredients = [];
    gl && gl.recipes && gl.recipes.forEach(function(r, i) {
        r.recipe.ingredients.forEach(function(ing, i) {
            all_ingredients.push({ ingredient: ing, recipe: r.recipe, index: i, crossed: ing.crossed });
        });
    });

    gl && gl.ingredients.forEach(function(ing, i) {
        all_ingredients.push({ ingredient: ing, index: i, crossed: ing.crossed });
    });

    return all_ingredients
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        let gl = (await dispatch(fetchGroceryListById(groceryListId))).payload;

        if (gl) {
            setGroceryList(gl);

            let all_ingredients = getAllIngredients(gl);
            setOriginalAllIngredients(all_ingredients);
        }
      } catch (error) {
        console.error("Error fetching grocery list:", error);
      }
    }

    fetchData();
  }, [dispatch, groceryListId]);

  useEffect(() => {
    let all_ingredients = getAllIngredients(groceryList);
    setAllIngredients(all_ingredients);
  }, [groceryList]);

  const isSaveDisabled = (!originalAllIngredients.length || !allIngredients.length) || (originalAllIngredients.every((ing, i) => !!originalAllIngredients[i].crossed === !!allIngredients[i].crossed)) && (!ingredients.length || ingredients.every((ing, i) => !ing.amount || !ing.name));
  const handleSave = (e) => {
    if (!isSaveDisabled) {
        let newIngredients = [];
        groceryList.ingredients.forEach(function(ing) {
            newIngredients.push(ing);
        });
        ingredients.forEach(function(ing) {
            newIngredients.push(ing);
        });

        dispatch(editGroceryListFromFirestore({ fbid: groceryList.fbid, recipes: groceryList.recipes, ingredients: newIngredients }));
        
        navigate('/grocery-lists');
    }
  }

  let all_ingredients_by_type = getAllIngredientsByType(allIngredients);

  return (
    <main className="max-w-xl mx-auto p-6 space-y-8">

        {/* 2. RECIPE SELECTION & AUTO-GENERATED ITEMS */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="h-1 bg-[#1976D2]" />
            <div className="p-6">

                {/* COMPACT INGREDIENT LISTING */}
                <div className="space-y-6">
                    {/* Example Recipe Group: Chicken Parmesan */}
                    <div className="flex flex-col border border-slate-100 rounded-2xl overflow-hidden">
                        {/* Recipe Sub-Header */}
                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Chicken Parmesan</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">5 Ingredients</span>
                        </div>

                        {/* Compact Rows */}
                        <div className="divide-y divide-slate-50">
                            {[
                                { qty: "2 lbs", name: "Chicken Breast", aisle: "Meat" },
                                { qty: "1 jar", name: "Marinara Sauce", aisle: "Other" },
                                { qty: "8 oz", name: "Mozzarella", aisle: "Dairy" }
                            ].map((item, i) => (
                                <div 
                                    key={i} 
                                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}`}
                                >
                                    {/* Toggle Inclusion Checkbox */}
                                    <button className="w-6 h-6 rounded-lg border-2 border-blue-100 bg-white flex items-center justify-center text-[#1976D2] text-[10px]">
                                        <FontAwesomeIcon icon={faCheck} />
                                    </button>

                                    {/* Item Info */}
                                    <div className="flex-1 flex items-baseline gap-2 min-w-0">
                                        <span className="text-sm font-black text-[#1976D2] shrink-0">{item.qty}</span>
                                        <span className="text-sm font-bold text-slate-700 truncate">{item.name}</span>
                                    </div>

                                    {/* Mini Aisle Badge */}
                                    <span className="text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 border border-slate-200">
                                        {item. aisle}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Example Recipe Group: Garden Fresh Salad */}
                    <div className="flex flex-col border border-slate-100 rounded-2xl overflow-hidden">
                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Garden Fresh Salad</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">2 Ingredients</span>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {[
                                { qty: "1 head", name: "Romaine Lettuce", aisle: "Produce" },
                                { qty: "1/2 cup", name: "Croutons", aisle: "Other" }
                            ].map((item, i) => (
                                <div 
                                key={i} 
                                className={`flex items-center gap-3 px-4 py-3 ${i % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}`}
                                >
                                <button className="w-6 h-6 rounded-lg border-2 border-blue-100 bg-white flex items-center justify-center text-[#1976D2] text-[10px]">
                                    <FontAwesomeIcon icon={faCheck} />
                                </button>
                                <div className="flex-1 flex items-baseline gap-2 min-w-0">
                                    <span className="text-sm font-black text-[#1976D2] shrink-0">{item.qty}</span>
                                    <span className="text-sm font-bold text-slate-700 truncate">{item.name}</span>
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 border border-slate-200">
                                    {item.aisle}
                                </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* 3. MANUAL ITEMS SECTION (THE TEMPLATE YOU PROVIDED) */}
        <section className="bg-white rounded-3xl shadow-md border border-slate-200 overflow-hidden">
          <div className="h-1 bg-[#1976D2]" />
          <div className="p-6">
            <div className="flex items-center gap-2 mb-8">
              <FontAwesomeIcon icon={faClipboardList} className="text-[#1976D2]" />
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">
                Extra Store Items
              </h2>
            </div>

            <div className="flex flex-col">
              {manualItems.map((item, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-4 pb-6 mb-6 border-b border-slate-100 last:border-0 last:mb-0 last:pb-0"
                >
                  <div className="flex-1 flex flex-col gap-4 pt-2">
                    {/* Top Row: Qty and Aisle */}
                    <div className="flex gap-3">
                      <div className="w-28 shrink-0 relative">
                        <label className="absolute -top-2 left-3 px-1 bg-white z-10 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                          <FontAwesomeIcon icon={faHashtag} className="text-[8px]" /> Qty
                        </label>
                        <input 
                          type="text" 
                          value={item.amount}
                          className="w-full bg-[#f8fafc] rounded-xl px-4 py-3 text-base font-bold border outline-none transition-all focus:border-[#1976D2] focus:ring-4 focus:ring-blue-500/10 focus:bg-white"
                          placeholder="1"
                        />
                      </div>

                      <div className="flex-1 relative">
                        <label className="absolute -top-2 left-3 px-1 bg-white z-10 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                          <FontAwesomeIcon icon={faTag} className="text-[8px]" /> Aisle
                        </label>
                        <Select 
                          options={aisleOptions}
                          defaultValue={aisleOptions[0]}
                          styles={selectStyles}
                        />
                      </div>
                    </div>

                    {/* Bottom Row: Name */}
                    <div className="w-full relative">
                      <label className="absolute -top-2 left-3 px-1 bg-white z-10 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                        <FontAwesomeIcon icon={faUtensils} className="text-[8px]" /> Name
                      </label>
                      <input 
                        type="text" 
                        value={item.name}
                        className="w-full bg-[#f8fafc] rounded-xl px-4 py-3 text-base font-bold border outline-none transition-all focus:border-[#1976D2] focus:ring-4 focus:ring-blue-500/10 focus:bg-white"
                        placeholder="Item name..."
                      />
                    </div>
                  </div>

                  {/* Delete Button */}
                  <div className="shrink-0 self-center mt-4"> 
                    <button className="w-14 h-14 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-90">
                      <FontAwesomeIcon icon={faTrashAlt} className="text-xl" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Item Button */}
            <div className="mt-8">
              <button className="w-full bg-blue-50 text-[#1976D2] py-4 rounded-2xl font-bold text-xs uppercase tracking-widest border-2 border-dashed border-blue-100 hover:bg-blue-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                <FontAwesomeIcon icon={faPlus} />
                Add Extra Item
              </button>
            </div>
          </div>
        </section>

        {/* FLOATING SAVE BUTTON */}
        <button className="fixed bottom-6 right-6 w-16 h-16 bg-[#1976D2] text-white rounded-2xl shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center transform active:scale-95 z-50">
            <FontAwesomeIcon icon={faSave} className="text-2xl" />
        </button>
      </main>
  );
};

export default ViewGroceryList;