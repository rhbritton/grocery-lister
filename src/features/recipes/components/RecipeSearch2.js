import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faMagnifyingGlass, 
    faChevronDown,
    faSearch,
    faFilter
} from '@fortawesome/free-solid-svg-icons';

import Select from 'react-select';

import { fetchRecipes, selectRecipes, searchRecipes, getRecipesFromFirestore, searchRecipesFromAll, setRecipeSearchParams } from '../slices/recipesSlice.ts';

function RecipeSearch(props) {
    const categories = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Dessert', 'Breakfast2 & Lunch2', 'Lunch2', 'Dinner2 & Snacks2', 'Snacks2', 'Dessert2'];

    const { userId } = props;
    const dispatch = useDispatch();
    
    const [isFiltered, setIsFiltered] = useState(false);

    // Custom styles to match your #1976D2 blue and rounded-xl theme
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
        fontSize: '12px',
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
        fontSize: '14px',
        '&:active': { backgroundColor: '#1976D2' }
      }),
    };
    
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [maxTime, setMaxTime] = useState(125);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    
    const { searchTerm, searchType, allRecipes, favoriteRecipes } = useSelector(state => state.recipes);
    
    const debouncedSearchRef = useRef(null); 
    // const handleSearch = (termToSearch, typeToSearch) => {
    //     clearTimeout(debouncedSearchRef.current);
    //     debouncedSearchRef.current = setTimeout(() => {
    //         // dispatch(searchRecipes(searchTerm));
    //         // dispatch(searchRecipes({ searchString: searchTerm, searchType: searchType }));
    //         if (termToSearch.trim().length != 1)
    //             dispatch(getRecipesFromFirestore({ 
    //                 resetPagination: true, 
    //                 userId, 
    //                 searchTerm: termToSearch, 
    //                 searchType: typeToSearch, 
    //                 includeFavorites: true 
    //             }));
    //     }, 500);
    // };

    const handleSearch = (termToSearch, typeToSearch) => {
        clearTimeout(debouncedSearchRef.current);
        debouncedSearchRef.current = setTimeout(() => {
            if (termToSearch.trim().length != 1) {
                dispatch(searchRecipesFromAll({ 
                    searchTerm: termToSearch, 
                    searchType: typeToSearch
                }));
            }
        }, 100);
    };

    useEffect(() => {
        dispatch(searchRecipesFromAll({ 
            searchTerm: searchTerm,
            searchType: searchType 
        }));
    }, [dispatch, allRecipes, favoriteRecipes]);

    return (
        <div className="sticky top-[90px] z-40 bg-[#F8FAFC] pt-4 pb-2 px-1 -mx-1">
            <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <FontAwesomeIcon icon={faSearch} />
                    </span>
                    <input
                        name="searchTerm"
                        type="text"
                        placeholder={`Search recipes by ${searchType?.toLowerCase() || 'name'}...`}
                        className="w-full bg-white border-0 rounded-xl py-4 pl-12 pr-4 text-md shadow-md ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                        value={searchTerm}
                        onChange={(e) => {
                            const newTerm = e.target.value;
                            dispatch(setRecipeSearchParams({ searchTerm: newTerm, searchType: searchType }));
                            handleSearch(newTerm, searchType); 
                        }}
                    />
                </div>
        
                {/* Filter Toggle Button - Changes color when active */}
                <button 
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`relative px-5 rounded-xl shadow-md border transition-all duration-300 ${
                        isFilterOpen 
                        ? 'bg-[#1976D2] border-[#1976D2] text-white' // Open State
                        : isFiltered 
                            ? 'bg-blue-50 border-blue-200 text-[#1976D2]' // Closed but Active State
                            : 'bg-white text-[#1976D2] border-slate-200 hover:text-[#1976D2] hover:bg-slate-50' // Default State
                    }`}
                >
                    <FontAwesomeIcon icon={faFilter} />

                    {/* Active Filter Indicator Dot */}
                    {isFiltered && !isFilterOpen && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            {/* Subtle pulse effect to grab attention once */}
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#1976D2] border-2 border-white"></span>
                        </span>
                    )}
                </button>
            </div>

            {/* Expanded Filter Options */}
            {isFilterOpen && (
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 mb-8 animate-in slide-in-from-top-2 duration-200">
                    
                    <div className="relative w-full">
                        {/* Floating Outlined Label */}
                        <label className="absolute -top-2 left-3 px-1 bg-white z-10 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faSearch} className="text-[9px]" /> Search By
                        </label>

                        <Select 
                            name="searchType"
                            value={{ value: searchType, label: searchType }}
                            options={[
                                { value: 'Name', label: 'Name' },
                                { value: 'Ingredient', label: 'Ingredient' }
                            ]}
                            defaultValue={{ value: 'Name', label: 'Name' }}
                            styles={selectStyles}
                            onChange={(option) => {
                                const newType = option.value;
                                dispatch(setRecipeSearchParams({ searchTerm: searchTerm, searchType: newType }));
                                handleSearch(searchTerm, newType);
                            }}
                        />
                    </div>
          
                    {/* Categories - Multi-Toggle Buttons */}
                    {/* <div className="flex flex-col pb-4">
                        <label className="pt-4 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <FontAwesomeIcon icon={faTag} className="text-[9px]" /> Categories
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {categories.map((cat) => {
                                const isSelected = cat === 'Dinner'; 

                                return (
                                    <button
                                        key={cat}
                                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                                        isSelected
                                            ? 'bg-[#1976D2] border-[#1976D2] text-white shadow-md'
                                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>
                    </div> */}


                    <div className="flex flex-col">
                        {/* <div className="flex justify-between items-center">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <FontAwesomeIcon icon={faClock} className="opacity-70" /> Max Cook Time
                            </label>
                            
                            <span className={`text-sm font-bold px-3 py-1 rounded-full transition-all duration-300 ${
                                maxTime === 125 
                                ? 'bg-slate-100 text-slate-500 border border-slate-200' // "Off" state look
                                : 'bg-blue-50 text-blue-600 border border-blue-100 shadow-sm' // "Active" state look
                            }`}>
                                {maxTime === 125 ? 'Any Time' : `${maxTime} mins`}
                            </span>
                        </div>

                        <div className="relative h-12 flex items-center">
                            <div className="absolute w-full h-2 bg-slate-100 rounded-full"></div>
                            
                            <div 
                                className="absolute h-2 bg-blue-500 rounded-full" 
                                style={{ width: `${((maxTime - 5) / 120) * 100}%` }}
                            ></div>

                            <div 
                                className="absolute w-8 h-8 bg-white border-2 border-[#1976D2] rounded-full shadow-md z-10 pointer-events-none flex items-center justify-center"
                                style={{ left: `calc(${((maxTime - 5) / 120) * 100}% - 16px)` }}
                            >
                                <div className="w-1 h-3 bg-slate-200 rounded-full"></div>
                            </div>

                            <input 
                                type="range" min="5" max="125" step="5" value={maxTime}
                                onChange={(e) => setMaxTime(parseInt(e.target.value))}
                                className="absolute w-full h-full opacity-0 cursor-pointer z-20"
                            />
                        </div>
                
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1 px-1">
                            <span>5M</span>
                            <span>60M</span>
                            <span className={maxTime === 125 ? 'text-blue-600' : ''}>ANY</span>
                        </div> */}

                        {/* Apply and Reset Actions Section */}
                        <div className="pt-6 border-t border-slate-100 flex items-center gap-3">
                        
                            {/* Reset Action - Subtle Bordered Style */}
                            <button 
                                onClick={() => {
                                    dispatch(setRecipeSearchParams({ searchTerm, searchType: 'Name' }));
                                    handleSearch(searchTerm, 'Name');
                                }}
                                className="flex-1 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-bold text-[11px] uppercase tracking-wider hover:bg-slate-50 hover:text-slate-700 transition-all active:scale-[0.98]"
                            >
                                Reset
                            </button>

                            {/* Apply Action - Primary Blue Style */}
                            <button 
                                onClick={() => setIsFilterOpen(false)}
                                className="flex-[2] bg-[#1976D2] text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RecipeSearch;