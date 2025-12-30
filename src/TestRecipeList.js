import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faPlus, 
  faBook, 
  faTrashAlt, 
  faEdit, 
  faFilter, 
  faChevronRight, 
  faClipboardList,
  faUtensils,
  faBookmark,
  faUserCircle,
  faSignOutAlt,
  faClock,
  faTag
} from '@fortawesome/free-solid-svg-icons';

import Select from 'react-select';

const GroceryLister = () => {
    const isFiltered = true;

  const recipes = [
    { id: 1, name: 'Broatfast Chicken Disans', category: 'Breakfast', prepTime: '20m' },
    { id: 2, name: 'Kimmy\'s Recipe', category: 'Dinner', prepTime: '45m' },
    { id: 3, name: 'Garden Fresh Salad', category: 'Lunch', prepTime: '15m', isSaved: true, savedName: 'Kaitlin Britton' },
    { id: 4, name: 'Homemade Pizza', category: 'Dinner', prepTime: '60m' },
    { id: 5, name: 'Homemade Pizza', category: 'Dinner', prepTime: '60m' },
    { id: 6, name: 'Homemade Pizza', category: 'Dinner', prepTime: '60m' },
    { id: 7, name: 'Homemade Pizza', category: 'Dinner', prepTime: '60m' },
    { id: 8, name: 'Homemade Pizza', category: 'Dinner', prepTime: '60m' },
    { id: 9, name: 'Homemade Pizza', category: 'Dinner', prepTime: '60m' },
    { id: 10, name: 'Homemade Pizza', category: 'Dinner', prepTime: '60m' },
    { id: 11, name: 'Homemade Pizza', category: 'Dinner', prepTime: '60m' },
    { id: 12, name: 'Homemade Pizza', category: 'Dinner', prepTime: '60m' },
    { id: 13, name: 'Homemade Pizza', category: 'Dinner', prepTime: '60m' },
    { id: 14, name: 'Homemade Pizza', category: 'Dinner', prepTime: '60m' },
    { id: 15, name: 'Homemade Pizza', category: 'Dinner', prepTime: '60m' },
    { id: 16, name: 'Homemade Pizza', category: 'Dinner', prepTime: '60m' },
  ];

  const categoryOptions = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snacks', label: 'Snacks' }
    ];

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-24">
      {/* Header - Fixed with Main Blue */}
      <header className="bg-[#1976D2] px-6 py-4 shadow-lg sticky top-0 z-50">
    <div className="max-w-xl mx-auto flex items-center justify-between relative">
      
      {/* Logo Section */}
      <div className="flex items-center gap-3">
        <FontAwesomeIcon icon={faUtensils} className="text-white text-xl opacity-90" />
        <h1 className="text-white text-2xl font-bold tracking-tight">Recipes</h1>
      </div>

      {/* Profile Section */}
      <div className="relative">
        <button 
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="w-10 h-10 flex items-center justify-center text-white/90 hover:text-white transition-colors focus:outline-none"
        >
          <FontAwesomeIcon icon={faUserCircle} className="text-3xl" />
        </button>

        {/* Dropdown Menu */}
{isProfileOpen && (
  <>
    {/* Invisible backdrop */}
    <div 
      className="fixed inset-0 z-40" 
      onClick={() => setIsProfileOpen(false)}
    ></div>

    <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
      
      {/* User Info Header - Tightened Padding */}
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
        <p className="text-sm font-bold text-slate-800 leading-tight">Ryan Britton</p>
        <p className="text-[11px] text-slate-500 font-medium">ryanhbritton@gmail.com</p>
      </div>

      {/* Action Buttons */}
        <div className="px-2 pb-2 pt-0">
        <button 
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 font-bold hover:bg-red-50 hover:text-red-600 rounded-xl transition-all group"
            onClick={() => console.log("Logging out...")}
        >
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <FontAwesomeIcon 
                icon={faSignOutAlt} 
                className="text-slate-400 group-hover:text-red-600 transition-colors text-lg" 
            />
            </div>
            <span className="uppercase tracking-wider text-[11px]">Logout</span>
        </button>
        </div>
    </div>
  </>
)}
      </div>

    </div>
  </header>






      {/* Main Content Container - Increased min-width/max-width for better spacing */}
      <main className="max-w-xl mx-auto min-w-[380px] p-6 pt-0 mb-16">
        
        
        <div className="sticky top-[90px] z-40 bg-[#F8FAFC] pt-4 pb-2 px-1 -mx-1">
        
        {/* Search & Filter Bar */}
    <div className="flex gap-3 mb-4">
      <div className="relative flex-1">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <FontAwesomeIcon icon={faSearch} />
        </span>
        <input 
          type="text" 
          placeholder="Search recipes..." 
          className="w-full bg-white border-0 rounded-xl py-4 pl-12 pr-4 text-md shadow-md ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
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
            : 'bg-white border-slate-200 text-slate-400 hover:text-[#1976D2] hover:bg-slate-50' // Default State
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
      options={[
        { value: 'name', label: 'Name' },
        { value: 'ingredients', label: 'Ingredients' }
      ]}
      defaultValue={{ value: 'name', label: 'Name' }}
      styles={selectStyles}
    />
  </div>
          
            {/* Categories - Multi-Toggle Buttons */}
      <div className="flex flex-col pb-4">
        <label className="pt-4 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <FontAwesomeIcon icon={faTag} className="text-[9px]" /> Categories
        </label>
        <div className="flex flex-wrap gap-2">
          {['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Dessert', 'Breakfast2 & Lunch2', 'Lunch2', 'Dinner2 & Snacks2', 'Snacks2', 'Dessert2'].map((cat) => {
            // Placeholder state logic: check if cat is in selectedCategories array
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
      </div>


        <div className="flex flex-col">
    <div className="flex justify-between items-center">
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

{/* Robust Slider Container */}
            <div className="relative h-12 flex items-center">
              {/* 1. The Visual Track */}
              <div className="absolute w-full h-2 bg-slate-100 rounded-full"></div>
              
              {/* 2. The Visual Blue Progress */}
              <div 
                className="absolute h-2 bg-blue-500 rounded-full" 
                style={{ width: `${((maxTime - 5) / 120) * 100}%` }}
              ></div>

              {/* 3. The Visual Thumb */}
              <div 
                className="absolute w-8 h-8 bg-white border-2 border-[#1976D2] rounded-full shadow-md z-10 pointer-events-none flex items-center justify-center"
                style={{ left: `calc(${((maxTime - 5) / 120) * 100}% - 16px)` }}
              >
                <div className="w-1 h-3 bg-slate-200 rounded-full"></div>
              </div>

              {/* 4. The Real Invisible Input (Huge Hit Area) */}
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
            </div>

            {/* Apply and Reset Actions Section */}
<div className="pt-6 border-t border-slate-100 flex items-center gap-3">
  
  {/* Reset Action - Subtle Bordered Style */}
  <button 
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








        {/* Recipe Cards List */}
        <div className="space-y-4">
          {recipes.map((recipe) => (
            <div 
  key={recipe.id} 
  className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center shadow-md active:shadow-sm transition-all duration-100 cursor-pointer group"
>

  {/* Text Content */}
  <div className="flex-1 min-w-0 flex flex-col items-start text-left">
    <h3 className="text-lg font-bold text-slate-800 truncate leading-tight w-full">
      {recipe.name}
    </h3>
    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5 w-full">
       <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider 
         ${recipe.isSaved 
           ? 'text-amber-700 bg-amber-50' 
           : 'text-blue-600 bg-blue-50'
         }`}
       >
          {recipe.category}
       </span>
       
       <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
          <span>• {recipe.prepTime}</span>
          
          {/* Using recipe.savedName here */}
          {recipe.isSaved && recipe.savedName && (
            <span className="flex items-center gap-1">
              <span className="opacity-60">•</span>
              <span>By <span className="text-slate-600 font-semibold">{recipe.savedName}</span></span>
            </span>
          )}
       </span>
    </div>
  </div>

  {/* Action Icons - Hidden if Saved */}
  <div className="flex items-center gap-1 ml-2 shrink-0">
    {!recipe.isSaved && (
      <>
        <button className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all active:scale-90">
          <FontAwesomeIcon icon={faEdit} className="text-xl" />
        </button>
        <button className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all active:scale-90">
          <FontAwesomeIcon icon={faTrashAlt} className="text-xl" />
        </button>
      </>
    )}
    {recipe.isSaved && (
      <>
        {/* Left Icon Block */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 
          ${recipe.isSaved 
            ? 'bg-amber-50' 
            : 'bg-blue-50'
          }`}
        >
          <FontAwesomeIcon 
            icon={recipe.isSaved ? faBookmark : faBook} 
            className={`text-lg transition-colors duration-300 
              ${recipe.isSaved 
                ? 'text-amber-600' 
                : 'text-[#1976D2]'
              }`} 
          />
        </div>
      </>
    )}
  </div>
</div>
          ))}
        </div>
      </main>

      {/* Primary Floating Action Button (FAB) */}
<button className="fixed bottom-24 right-6 w-16 h-16 bg-[#1976D2] text-white rounded-2xl shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center transform hover:scale-110 active:scale-95 z-30">
  <FontAwesomeIcon icon={faPlus} className="text-2xl" />
</button>

      {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-stretch h-20 z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        
        {/* Recipes - SELECTED STATE */}
        <button className="flex-1 flex flex-col items-center justify-center bg-[#1976D2] text-white transition-all duration-200 group">
            <div className="flex flex-col items-center">
            <FontAwesomeIcon icon={faBook} className="text-xl mb-1" />
            <span className="text-[11px] font-bold uppercase tracking-widest">Recipes</span>
            </div>
        </button>

        {/* List - UNSELECTED STATE */}
        <button className="flex-1 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all duration-200">
            <div className="flex flex-col items-center">
            <FontAwesomeIcon icon={faClipboardList} className="text-xl mb-1" />
            <span className="text-[11px] font-bold uppercase tracking-widest">List</span>
            </div>
        </button>

        </nav>
    </div>
  );
};

export default GroceryLister;