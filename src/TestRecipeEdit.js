import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faBook, 
  faEdit, 
  faFilter, 
  faChevronRight, 
  faClipboardList,
  faUtensils,
  faBookmark,
  faUserCircle,
  faSignOutAlt,

  faChevronLeft, 
  faSave, 
  faPlus, 
  faTrashAlt, 
  faClock, 
  faTag, 
  faListUl, 
  faMortarPestle,
  faHashtag,

  faShareAlt, 
  faHeart, 
  faCheckCircle, 
  faCircle,
  faSyncAlt
} from '@fortawesome/free-solid-svg-icons';
import Select from 'react-select';

const RecipeEditView = () => {
    
    const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [recipe, setRecipe] = useState({
    name: "Chicken Parmesan",
    prepTime: "45",
    category: { value: 'dinner', label: 'Dinner' },
    ingredients: [{ amount: "1", name: "", aisle: "Other" }, { amount: "1", name: "", aisle: "Other" }, { amount: "1", name: "", aisle: "Other" }],
    instructions: "1. Preheat oven to 400°F.\n2. Coat chicken in breadcrumbs.\n3. Pan-fry until golden.\n4. Bake with sauce and cheese for 20 mins."
  });

  const categoryOptions = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snacks', label: 'Snacks' }
  ];

  // Reusing your specific styles from the List Page
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


  {/* Custom compact styles for the Aisle selector */}
const aisleSelectStyles = selectStyles;

const aisleOptions = [
  { value: 'Other', label: 'Other' },
  { value: 'Produce', label: 'Produce' },
  { value: 'Meat', label: 'Meat' },
  { value: 'Dairy', label: 'Dairy' },
  { value: 'Freezer', label: 'Freezer' },
];

  // Default state for a new ingredient
const addIngredient = () => {
  setRecipe({ 
    ...recipe, 
    ingredients: [...recipe.ingredients, { amount: "1", name: "", aisle: "Other" }] 
  });
};

// Update specific fields within an ingredient object
const updateIngredient = (index, field, value) => {
  const newList = [...recipe.ingredients];
  newList[index] = { ...newList[index], [field]: value };
  setRecipe({ ...recipe, ingredients: newList });
};

const removeIngredient = (index) => setRecipe({ ...recipe, ingredients: recipe.ingredients.filter((_, i) => i !== index) });

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-24">
      
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
                          <h1 className="text-white text-2xl font-bold tracking-tight"> Recipes Edit</h1>
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
        value={recipe.name}
        onChange={(e) => setRecipe({...recipe, name: e.target.value})}
        className="w-full text-xl font-bold text-slate-800 border-b-2 border-slate-300 focus:border-[#1976D2] outline-none pb-1 transition-all"
        placeholder="Enter recipe name..."
      />
    </div>

    {/* Metadata Row: Time and Category */}
    <div className="flex flex-col sm:flex-row gap-6 pt-2"> {/* Added pt-2 so the top label has room */}
  
  {/* Time (Mins) Field */}
  <div className="flex-1 relative">
    <label className="absolute -top-2 left-3 px-1 bg-white z-10 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
      <FontAwesomeIcon icon={faClock} className="text-[9px]" /> Time (Mins)
    </label>
    <input 
      type="number" 
      value={recipe.prepTime}
      onChange={(e) => setRecipe({...recipe, prepTime: e.target.value})}
      className="w-full bg-[#f8fafc] rounded-xl px-4 py-3 text-base font-bold border outline-none transition-all focus:border-[#1976D2] focus:ring-4 focus:ring-blue-500/10 focus:bg-white"
    />
  </div>
  
  {/* Category Field */}
  <div className="flex-1 relative">
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
  </div>
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
  {recipe.ingredients.map((ing, i) => (
    <div 
      key={i} 
      /* Tightened external spacing: pb-6 and mb-6 */
      className="flex items-center gap-4 pb-6 mb-6 border-b border-slate-100 last:border-0 last:mb-0 last:pb-0"
    >
      {/* 1. Input Stack (Left Side) - pt-2 ensures the first row labels have room */}
      <div className="flex-1 flex flex-col gap-4 pt-2">
        
        {/* Top Row: Amount and Aisle */}
        <div className="flex gap-3">
          {/* Amount Field */}
          <div className="w-28 shrink-0 relative">
            <label className="absolute -top-2 left-3 px-1 bg-white z-10 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
              <FontAwesomeIcon icon={faHashtag} className="text-[8px]" /> Qty
            </label>
            <input 
              type="text" 
              value={ing.amount}
              onChange={(e) => updateIngredient(i, 'amount', e.target.value)}
              className="w-full bg-[#f8fafc] rounded-xl px-4 py-3 text-base font-bold border outline-none transition-all focus:border-[#1976D2] focus:ring-4 focus:ring-blue-500/10 focus:bg-white"
              placeholder="1 cup"
            />
          </div>

          {/* Aisle / Category Field */}
          <div className="flex-1 relative">
            <label className="absolute -top-2 left-3 px-1 bg-white z-10 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
              <FontAwesomeIcon icon={faTag} className="text-[8px]" /> Aisle
            </label>
            <Select 
              options={aisleOptions}
              value={aisleOptions.find(opt => opt.value === ing.aisle)}
              onChange={(opt) => updateIngredient(i, 'aisle', opt.value)}
              styles={aisleSelectStyles}
              menuPortalTarget={document.body} 
                menuPosition="fixed"
            />
          </div>
        </div>

        {/* Bottom Row: Ingredient Name */}
        <div className="w-full relative">
          <label className="absolute -top-2 left-3 px-1 bg-white z-10 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
            <FontAwesomeIcon icon={faUtensils} className="text-[8px]" /> Name
          </label>
          <input 
            type="text" 
            value={ing.name}
            onChange={(e) => updateIngredient(i, 'name', e.target.value)}
            className="w-full bg-[#f8fafc] rounded-xl px-4 py-3 text-base font-bold border outline-none transition-all focus:border-[#1976D2] focus:ring-4 focus:ring-blue-500/10 focus:bg-white"
            placeholder="Tomatoes, diced"
          />
        </div>
      </div>

      {/* 2. Vertically Centered Delete Button */}
      {/* Adjusted mt-4: Since the stack is tighter, the vertical center shift is slightly less */}
      <div className="shrink-0 self-center mt-4"> 
        <button 
          onClick={() => removeIngredient(i)} 
          className="w-14 h-14 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-90 active:bg-red-100"
        >
          <FontAwesomeIcon icon={faTrashAlt} className="text-xl" />
        </button>
      </div>
    </div>
  ))}
</div>

    {/* 3. Thumb-Friendly Add Button at the bottom */}
    <div className="mt-8">
      <button 
        onClick={addIngredient} 
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
              rows="12"
              value={recipe.instructions}
              onChange={(e) => setRecipe({...recipe, instructions: e.target.value})}
              placeholder="Enter your steps here..."
              className="w-full bg-slate-50 rounded-2xl p-4 text-base leading-relaxed border outline-none transition-all resize-none font-medium text-slate-700"
            />
          </div>
          

            {/* Optional: Footer Tip */}
            <p className="mb-10 mt-3 ml-6 mr-6 text-sm text-slate-400 font-medium italic px-1">
            Tip: Press Enter for new lines. These will appear as separate steps in the view mode.
            </p>
        </section>

      </main>

      {/* Primary Floating Action Button */}
      <button className="fixed bottom-6 right-6 w-16 h-16 bg-[#1976D2] text-white rounded-2xl shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center transform active:scale-95 z-50">
        <FontAwesomeIcon icon={faSave} className="text-2xl" />
      </button>
    </div>
  );
};

export default RecipeEditView;