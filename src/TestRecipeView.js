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

  faChevronLeft, 
  faShareAlt, 
  faHeart, 
  faCheckCircle, 
  faCircle,
  faListUl,
  faMortarPestle,
  faSyncAlt,
  faTag
} from '@fortawesome/free-solid-svg-icons';

const RecipeDetailView = () => {
    
    const [isProfileOpen, setIsProfileOpen] = useState(false);

  // 'instructions' or 'ingredients'
  const [activePanel, setActivePanel] = useState('instructions'); 
  const [checkedIngredients, setCheckedIngredients] = useState({});

  const toggleIngredient = (idx) => {
    setCheckedIngredients(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const recipe = {
    name: "Chicken Parmesan",
    ingredients: [
        "2 Chicken Breasts", 
        "1 cup Breadcrumbs", 
        "1/2 cup Parmesan", 
        "2 cups Marinara", 
        "8oz Mozzarella", 
        "Fresh Basil",
        "1 cup Breadcrumbs", 
        "1/2 cup Parmesan", 
        "2 cups Marinara", 
        "8oz Mozzarella", 
        "Fresh Basil"
    ],
    instructions: [
      "Preheat oven to 400°F.",
      "Coat chicken in breadcrumbs and parmesan mix.",
      "Pan-fry chicken until golden brown on both sides.",
      "Place in baking dish, cover with sauce and cheese.",
      "Bake for 15-20 minutes until cheese is bubbly.",
      "Bake for 15-20 minutes until cheese is bubbly.",
      "Bake for 15-20 minutes until cheese is bubbly.",
      "Bake for 15-20 minutes until cheese is bubbly.",
      "Bake for 15-20 minutes until cheese is bubbly.",
      "Bake for 15-20 minutes until cheese is bubbly.",
      "Bake for 15-20 minutes until cheese is bubbly.",
      "Bake for 15-20 minutes until cheese is bubbly.",
      "Bake for 15-20 minutes until cheese is bubbly.",
      "Bake for 15-20 minutes until cheese is bubbly."
    ]
  };

  const mainBlue = '#1976D2';

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
          {/* Header - Fixed with Main Blue */}
          <header className="bg-[#1976D2] px-6 py-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-xl mx-auto flex items-center justify-between relative">
          
          {/* Primary Back Navigation */}
            <button 
            onClick={() => window.history.back()} 
            className="text-white/90 hover:text-white transition-all p-1 -ml-2"
            >
                <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faChevronLeft} className="text-xl" />
                    <h1 className="text-white text-2xl font-bold tracking-tight"> Recipes View</h1>
                </div>
            </button>
    
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
            <p className="text-base text-slate-500 font-medium">ryanhbritton@gmail.com</p>
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
                <span className="uppercase tracking-wider text-base">Logout</span>
            </button>
            </div>
        </div>
      </>
    )}
          </div>
    
        </div>
      </header>
    
    
    
    
    
    
          {/* Main Content Container - Increased min-width/max-width for better spacing */}
          <main className="max-w-xl mx-auto min-w-[380px] p-6">
  
  {/* Header Row: Title on Left, Actions on Right */}
<div className="flex justify-between items-start mb-6 px-1">
  
  {/* Top Left: Recipe Name & Metadata */}
  <div className="flex-1 pr-4">
    {/* Smaller Title: Changed from text-3xl font-black to text-2xl font-bold */}
    <h1 className="text-left text-2xl font-bold text-slate-800 leading-tight">
      Chicken Parmesan
    </h1>
    
    {/* Owner Section */}
    <div className="flex items-center gap-1.5">
      <span className="text-base font-medium text-slate-400">By</span>
      <span className="text-base font-bold text-slate-700 hover:text-[#1976D2] transition-colors cursor-pointer">
        Kaitlin Britton
      </span>
    </div>
    
    {/* Metadata Row: Time, Category, and Owner */}
<div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5 text-slate-500">
  
  {/* Time Section */}
  <div className="flex items-center gap-1.5 text-[#1976D2]">
    <FontAwesomeIcon icon={faClock} className="text-[10px]" />
    <span className="text-base font-bold uppercase tracking-wider">45 Mins</span>
  </div>

  {/* Separator Dot */}
  <span className="text-slate-300 text-xs">•</span>

  {/* Category Section */}
  <div className="flex items-center gap-1.5 text-[#1976D2]">
    <FontAwesomeIcon icon={faTag} className="text-[10px]" />
    <span className="text-base font-bold uppercase tracking-wider">
      Dinner
    </span>
  </div>
</div>
  </div>

  {/* Top Right: Action Buttons (Kept consistent) */}
  <div className="flex gap-2 shrink-0">
    <button className="w-14 h-14 flex items-center justify-center bg-white border text-[#1976D2] border-blue-200 rounded-xl shadow-sm transition-all active:scale-90">
      <FontAwesomeIcon icon={faEdit} />
    </button>

    <button className="w-14 h-14 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-200 rounded-xl shadow-sm transition-all active:scale-90">
      <FontAwesomeIcon icon={faBookmark} />
    </button>
    
    <button className="w-14 h-14 flex items-center justify-center bg-white border text-green-600 border-green-200 rounded-xl shadow-sm transition-all active:scale-90">
      <FontAwesomeIcon icon={faShareAlt} />
    </button>
  </div>
</div>
        
        {/* Flex Container */}
<div className="flex bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden h-[calc(100vh-18rem)] relative">
  
  {/* INSTRUCTIONS PANEL (Left) */}
  <section 
    onClick={() => setActivePanel('instructions')}
    className={`relative transition-all duration-500 ease-in-out border-r border-slate-100 overflow-y-auto scrollbar-hide
      ${activePanel === 'instructions' 
        ? 'w-[70%] bg-white z-10 shadow-[4px_0_15px_rgba(0,0,0,0.05)]' 
        : 'w-[30%] bg-[#F8FAFC] cursor-pointer'}`}
  >
    {/* FIXED HEADER: Solid background prevents text overlap */}
    <div className={`sticky top-0 z-30 transition-all duration-500 border-b border-transparent
      ${activePanel === 'instructions' ? 'bg-white border-slate-100' : 'bg-[#F8FAFC]'}`}>
      
      <div className={`h-1 transition-colors duration-500 ${activePanel === 'instructions' ? 'bg-[#1976D2]' : 'bg-transparent'}`} />
      
      <div className="px-5 py-4">
        <div className={`flex items-center gap-2 transition-all duration-500 ${activePanel === 'instructions' ? 'scale-100' : 'scale-90 opacity-60'}`}>
          <FontAwesomeIcon icon={faMortarPestle} className={activePanel === 'instructions' ? 'text-[#1976D2]' : 'text-slate-400'} />
          <h2 className={`text-base font-bold uppercase tracking-widest transition-colors ${activePanel === 'instructions' ? 'text-[#1976D2]' : 'text-slate-400'}`}>
            Steps
          </h2>
        </div>
      </div>

      {/* GRADIENT FADE: Signals scrolling availability */}
      <div className="absolute bottom-[-20px] left-0 right-0 h-5 bg-gradient-to-b from-inherit to-transparent pointer-events-none" />
    </div>

    {/* Content Area */}
    <div className="px-5 pb-10">
      <div className={`space-y-6 text-left transition-all duration-500 ${activePanel !== 'instructions' ? 'opacity-30 grayscale-[0.8]' : 'opacity-100'}`}>
        {recipe.instructions.map((step, i) => (
          <div key={i} className="flex gap-3">
            <span className={`text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-[0.25em] transition-colors
              ${activePanel === 'instructions' ? 'bg-blue-50 text-[#1976D2]' : 'bg-slate-200 text-slate-400'}`}>
              {i + 1}
            </span>
            <p className="text-base leading-relaxed text-slate-700 font-medium">{step}</p>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* INGREDIENTS PANEL (Right) */}
  <section 
    onClick={() => setActivePanel('ingredients')}
    className={`relative transition-all duration-500 ease-in-out overflow-y-auto scrollbar-hide
      ${activePanel === 'ingredients' 
        ? 'w-[70%] bg-white z-10 shadow-[-4px_0_15px_rgba(0,0,0,0.05)]' 
        : 'w-[30%] bg-[#F8FAFC] cursor-pointer'}`}
  >
    {/* FIXED HEADER */}
    <div className={`sticky top-0 z-30 transition-all duration-500 border-b border-transparent
      ${activePanel === 'ingredients' ? 'bg-white border-slate-100' : 'bg-[#F8FAFC]'}`}>
      
      <div className={`h-1 transition-colors duration-500 ${activePanel === 'ingredients' ? 'bg-[#1976D2]' : 'bg-transparent'}`} />
      
      <div className="px-5 py-4">
        <div className={`flex items-center gap-2 transition-all duration-500 ${activePanel === 'ingredients' ? 'scale-100' : 'scale-90 opacity-60'}`}>
          <FontAwesomeIcon icon={faListUl} className={activePanel === 'ingredients' ? 'text-[#1976D2]' : 'text-slate-400'} />
          <h2 className={`text-base font-bold uppercase tracking-widest transition-colors ${activePanel === 'ingredients' ? 'text-[#1976D2]' : 'text-slate-400'}`}>
            Ingredients
          </h2>
        </div>
      </div>

      {/* GRADIENT FADE */}
      <div className="absolute bottom-[-20px] left-0 right-0 h-5 bg-gradient-to-b from-inherit to-transparent pointer-events-none" />
    </div>

    {/* Content Area */}
    <div className="px-5 pb-10">
      <div className={`space-y-5 transition-all duration-500 ${activePanel !== 'ingredients' ? 'opacity-30 grayscale-[0.8]' : 'opacity-100'}`}>
        {recipe.ingredients.map((item, i) => (
          <div key={i} onClick={(e) => { if (activePanel !== 'ingredients') return; e.stopPropagation(); toggleIngredient(i); }}
            className={`flex items-start gap-3 transition-all ${activePanel === 'ingredients' ? 'cursor-pointer group' : 'cursor-default pointer-events-none'}`}>
            <div className="mt-[0.25em] shrink-0">
              <FontAwesomeIcon icon={checkedIngredients[i] ? faCheckCircle : faCircle} 
                className={checkedIngredients[i] && activePanel === 'ingredients' ? 'text-[#1976D2]' : 'text-slate-200'} />
            </div>
            <p className="text-base text-slate-700 font-medium text-left leading-tight">{item}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
</div>

      </main>

    </div>
  );
};

export default RecipeDetailView;