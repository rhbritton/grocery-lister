import React, { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronLeft, 
  faChevronDown, 
  faEdit, 
  faShareAlt, 
  faCheck, 
  faShoppingCart,
  faCalendarAlt,
  faUserCircle,
  faReceipt,
  faSave,
  faSignOutAlt,
  faClock,
  faTag,
  faBookmark,
  faUtensils
} from '@fortawesome/free-solid-svg-icons';

const GroceryListNotepadView = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});
  const [showRecipes, setShowRecipes] = useState(false);

  const listData = {
    date: "Dec 28, 2025",
    time: "2:05 PM",
    recipes: ["Chicken Parmesan [1]", "Garden Fresh Salad", "Garlic Bread", "Chicken Parmesan [2]", "Garden Fresh Salad", "Garlic Bread", "Chicken Parmesan", "Garden Fresh Salad", "Garlic Bread"],
    ingredients: [
      { id: 1, amount: "2 lbs", name: "Chicken Breast", aisle: "Meat", recipe: "Recipe 1" },
      { id: 2, amount: "1 can", name: "Marinara Sauce", aisle: "Other", recipe: "Recipe 1" },
      { id: 3, amount: "8 oz", name: "Mozzarella Cheese", aisle: "Dairy", recipe: "Recipe 1" },
      { id: 4, amount: "1 head", name: "Romaine Lettuce", aisle: "Produce" },
      { id: 5, amount: "1 loaf", name: "Italian Bread", aisle: "Other", recipe: "Recipe 1" },
      { id: 6, amount: "1 bag", name: "Frozen Peas", aisle: "Freezer", recipe: "Recipe 1" },
      { id: 7, amount: "3 cloves", name: "Garlic", aisle: "Produce" },
      { id: 8, amount: "1/2 cup", name: "Parmesan Cheese", aisle: "Dairy", recipe: "Recipe 1" },
    ]
  };

  const aisles = ["Produce", "Meat", "Dairy", "Freezer", "Other"];

  // Logic for Progress Calculations
  const totalItems = listData.ingredients.length;
  const checkedCount = useMemo(() => 
    Object.values(checkedItems).filter(Boolean).length, 
    [checkedItems]
  );
  const progressPercent = (checkedCount / totalItems) * 100;
  const isFinished = totalItems > 0 && checkedCount === totalItems;

  const toggleItem = (id) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openWalmart = (name) => {
    window.open(`https://www.walmart.com/search?q=${encodeURIComponent(name)}`, '_blank');
  };

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
                        <h1 className="text-white text-2xl font-bold tracking-tight"> Grocery Lists View</h1>
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

      <div className="bg-[#1976D2] h-6 shadow-lg sticky top-[90px] z-40">
        <div className="w-full h-6 bg-blue-900/20 relative flex items-center justify-center overflow-hidden">    
            {/* PROGRESS FILL */}
            <div 
                className={`absolute left-0 top-0 h-full transition-all duration-500 ease-out
                    ${isFinished ? 'bg-green-700' : 'bg-white'}`}
                style={{ width: `${progressPercent}%` }}
            />
            
            {/* CENTERED ITEM COUNT */}
            <span 
            className="relative z-10 text-[16px] font-black uppercase tracking-widest text-white transition-colors duration-300"
            style={{
                /* Creates a sharp 1px outline using your brand blue */
                textShadow: isFinished ? 'none' : `
                1.5px  1.5px 0 #1976D2,
                -1.5px -1.5px 0 #1976D2,
                1.5px -1.5px 0 #1976D2,
                -1.5px  1.5px 0 #1976D2,
                1.5px  0px 0 #1976D2,
                -1.5px  0px 0 #1976D2,
                0px  1.5px 0 #1976D2,
                0px -1.5px 0 #1976D2
                `
            }}>
            {checkedCount} / {totalItems} Items Completed
            </span>
        </div>
    </div>

      <main className="max-w-xl mx-auto min-w-[380px] p-6 mb-20">

{/* Header Section: Title/Actions on Top, Recipes Below */}
<div className="flex flex-col gap-4 mb-6 px-1">
  
  {/* Row 1: Title & Metadata on Left, Actions on Right */}
  <div className="flex justify-between items-start">
    
    {/* Top Left: List Identity */}
    <div className="flex-1 pr-4">
      
      {/* Date & Time Metadata */}
      <h1 className="text-left text-2xl font-bold text-slate-800 leading-tight">
        <FontAwesomeIcon icon={faCalendarAlt} className="text-lg mb-0.5 text-slate-600" />
        <span> {listData.date}</span>
      </h1>
      <div className="flex items-center gap-2 text-slate-400 mt-1">
        <span className="text-[16px] font-black uppercase tracking-[0.2em]">
          {listData.time}
        </span>
      </div>
    </div>

    {/* Top Right: Action Buttons */}
    <div className="flex gap-2 shrink-0">
      <button className="w-14 h-14 flex items-center justify-center bg-white border text-[#1976D2] border-blue-200 rounded-xl shadow-sm transition-all active:scale-90">
        <FontAwesomeIcon icon={faEdit} />
      </button>
      
      <button className="w-14 h-14 flex items-center justify-center bg-white border text-green-600 border-green-200 rounded-xl shadow-sm transition-all active:scale-90">
        <FontAwesomeIcon icon={faShareAlt} />
      </button>
    </div>
  </div>

  <div className="flex flex-col gap-2">
  {/* Toggle Button Container */}
  <button 
    onClick={() => setShowRecipes(!showRecipes)}
    className="flex items-center justify-between w-full group hover:bg-blue-50/30 p-2 pt-0 -ml-2 rounded-xl transition-all"
  >
    <div className="flex items-center gap-2 text-slate-600">
      <FontAwesomeIcon icon={faUtensils} className="text-md" />
      <span className="text-md font-black uppercase tracking-widest text-slate-800 transition-colors">
        Recipes
      </span>
      
      {/* Recipe Count Badge - Now Blue and more visible */}
      <span className="text-[14px] bg-blue-50 px-2 py-0.5 rounded-full font-black text-[#1976D2] border border-blue-100 animate-in zoom-in duration-200">
        {listData.recipes.length}
      </span>
    </div>

    {/* The Chevron - Bold, Black, and High Visibility */}
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white transition-colors">
      <FontAwesomeIcon 
        icon={faChevronDown} 
        className={`text-slate-900 text-sm ${showRecipes ? 'rotate-180' : 'rotate-0'}`} 
      />
    </div>
  </button>

  {/* Recipe Tags */}
  {showRecipes && (
    <div className="flex flex-wrap gap-x-2 gap-y-2 pl-1 pt-1 animate-in slide-in-from-top-2 duration-300 fade-in">
      {listData.recipes.map((recipe, i) => (
        <span 
          key={i} 
          className="text-[14px] font-bold text-[#1976D2] bg-blue-50/50 px-3 py-1.5 rounded-xl border border-blue-100/50 uppercase tracking-tight shadow-sm"
        >
          {recipe}
        </span>
      ))}
    </div>
  )}
</div>
</div>




        {/* 3. THE "PAPER" LIST */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 relative overflow-hidden">
          
          {/* Notebook Margin Line (Red Line) - Always Visible Overlay */}
          <div className="absolute left-14 top-0 bottom-0 w-px bg-red-300/40 z-30 pointer-events-none" />

          {aisles.map(aisle => {
            const itemsInAisle = listData.ingredients.filter(ing => ing.aisle === aisle);
            if (itemsInAisle.length === 0) return null;

            return (
              <section key={aisle} className="relative z-10">
                {/* Aisle Header */}
                <div className="bg-slate-200/90 px-16 py-2.5 border-b border-slate-300/50">
                  <h2 className="text-[14px] font-black uppercase tracking-[0.4em] text-slate-600">
                    {aisle}
                  </h2>
                </div>

                <div className="divide-y divide-slate-200/40">
                  {itemsInAisle.map((item, i) => {
                    const isEven = i % 2 === 0;
                    const isChecked = checkedItems[item.id];

                    return (
                      <div 
  key={item.id}
  className={`flex items-stretch group transition-all 
    ${isChecked 
      ? 'bg-slate-200/40' 
      : isEven ? 'bg-white' : 'bg-blue-50/50'
    }`}
>
  {/* 1. DEDICATED CHECK ZONE */}
  <button 
    onClick={() => toggleItem(item.id)}
    className={`w-14 shrink-0 flex items-center justify-center transition-all
      ${isChecked 
        ? 'bg-slate-200/40' 
        : isEven ? 'bg-slate-50' : 'bg-blue-50/50'
      }`}
  >
    <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all shadow-sm z-40
      ${isChecked 
        ? 'bg-[#1976D2] border-[#1976D2] scale-110' 
        : 'bg-white border-slate-300 group-hover:border-[#1976D2]'}`}
    >
      {isChecked && <FontAwesomeIcon icon={faCheck} className="text-white text-xs" />}
      {!isChecked && <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-blue-200 transition-colors" />}
    </div>
  </button>

  {/* 2. TEXT CONTENT ZONE */}
  <div className="flex-1 text-left pl-5 pr-2 py-5 cursor-pointer relative z-40" onClick={() => toggleItem(item.id)}>
    <p className={`text-base font-bold transition-all duration-300
      ${isChecked ? 'text-slate-400 line-through decoration-slate-400 decoration-2' : 'text-slate-800'}`}>
      {item.name}
    </p>
    
    {/* METADATA ROW: Amount and Recipe Source */}
    <div className="flex items-center gap-2 mt-0.5">
      <span className={`text-[14px] font-black uppercase tracking-widest ${isChecked ? 'text-slate-300' : 'text-[#1976D2]'}`}>
        {item.amount}
      </span>
      
      {/* Separator Dot */}
      <span className="text-slate-300 text-[14px]">•</span>
      
      {/* Recipe Attribution */}
      <span className={`text-[14px] font-black uppercase tracking-widest ${isChecked ? 'text-slate-200' : 'text-slate-400'}`}>
        {item.recipe || 'Manual Item'}
      </span>
    </div>
  </div>

  {/* 3. EXTERNAL ACTION ZONE */}
  <div className="flex items-center pr-4 relative z-40">
    <button 
      onClick={(e) => { e.stopPropagation(); openWalmart(item.name); }}
      className={`w-11 h-11 flex items-center justify-center transition-all rounded-2xl
        ${isChecked 
          ? 'opacity-20 grayscale' 
          : 'bg-white/50 border border-slate-200 text-slate-400 hover:text-[#1976D2] shadow-sm active:scale-90'}`}
    >
      <FontAwesomeIcon icon={faShoppingCart} className="text-sm" />
    </button>
  </div>
</div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

      </main>

      {/* 4. PRIMARY FLOATING SAVE BUTTON */}
      <button 
        className="fixed bottom-6 right-6 w-16 h-16 bg-[#1976D2] text-white rounded-2xl shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center transform active:scale-95 z-50 group"
      >
        <FontAwesomeIcon icon={faSave} className="text-2xl group-hover:animate-pulse" />
      </button>
    </div>
  );
};

export default GroceryListNotepadView;