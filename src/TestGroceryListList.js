import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faBook, 
  faTrashAlt, 
  faEdit, 
  faClipboardList,
  faUtensils,
  faUserCircle,
  faSignOutAlt,
  faCalendarAlt,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';

const GroceryListsView = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Sample data for grocery lists
  const groceryLists = [
    { 
      id: 1, 
      date: 'Dec 28, 2025', 
      time: '1:45 PM', 
      recipes: ['Chicken Parmesan', 'Garden Fresh Salad'],
      itemCount: 18 
    },
    { 
      id: 2, 
      date: 'Dec 24, 2025', 
      time: '10:30 AM', 
      recipes: ['Homemade Pizza', 'Garlic Knots', 'Ceasar Salad'],
      itemCount: 24 
    },
    { 
      id: 3, 
      date: 'Dec 20, 2025', 
      time: '4:15 PM', 
      recipes: ['Kimmy\'s Recipe'],
      itemCount: 9 
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-32">
      
      {/* Header - Fixed with Main Blue */}
      <header className="bg-[#1976D2] px-6 py-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-xl mx-auto flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faUtensils} className="text-white text-xl opacity-90" />
            <h1 className="text-white text-2xl font-bold tracking-tight">Grocery Lists</h1>
          </div>

          {/* Profile Section */}
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-10 h-10 flex items-center justify-center text-white/90 hover:text-white transition-colors focus:outline-none"
            >
              <FontAwesomeIcon icon={faUserCircle} className="text-3xl" />
            </button>
            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                  <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-sm font-bold text-slate-800 leading-tight">Ryan Britton</p>
                    <p className="text-[11px] text-slate-500 font-medium">ryanhbritton@gmail.com</p>
                  </div>
                  <div className="px-2 pb-2">
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 font-bold hover:bg-red-50 hover:text-red-600 rounded-xl transition-all group">
                        <FontAwesomeIcon icon={faSignOutAlt} className="text-slate-400 group-hover:text-red-600 text-lg" />
                        <span className="uppercase tracking-wider text-[11px]">Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-6">
        
        {/* Grocery Lists Cards */}
        <div className="space-y-4">
          {groceryLists.map((list) => (
            <div 
              key={list.id} 
              className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center shadow-md active:shadow-sm transition-all duration-100 cursor-pointer group"
            >

              {/* Text Content */}
              <div className="flex-1 min-w-0 flex flex-col items-start text-left">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-black text-slate-800 leading-tight">
                    {list.date}
                  </h3>
                  <span className="text-[14px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                    {list.time}
                  </span>
                </div>
                
                {/* Recipes included in this list */}
                <p className="text-sm text-slate-500 font-medium truncate w-full mb-1">
                  {list.recipes.join(', ')}
                </p>
                
                {/* Item Count Badge */}
                <span className="text-[14px] font-black px-2 py-0.5 rounded uppercase tracking-widest text-[#1976D2] bg-blue-50">
                   {list.itemCount} Items
                </span>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-1 ml-2 shrink-0">
                <button className="w-11 h-11 flex items-center justify-center text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-90">
                  <FontAwesomeIcon icon={faEdit} className="text-lg" />
                </button>
                <button className="w-11 h-11 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90">
                  <FontAwesomeIcon icon={faTrashAlt} className="text-lg" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Primary Floating Action Button (FAB) */}
      <button className="fixed bottom-28 right-6 w-16 h-16 bg-[#1976D2] text-white rounded-2xl shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center transform hover:scale-110 active:scale-95 z-30">
        <FontAwesomeIcon icon={faPlus} className="text-2xl" />
      </button>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-stretch h-20 z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <button className="flex-1 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all duration-200">
          <FontAwesomeIcon icon={faBook} className="text-xl mb-1" />
          <span className="text-[11px] font-bold uppercase tracking-widest">Recipes</span>
        </button>

        <button className="flex-1 flex flex-col items-center justify-center bg-[#1976D2] text-white transition-all duration-200 group">
          <FontAwesomeIcon icon={faClipboardList} className="text-xl mb-1" />
          <span className="text-[11px] font-bold uppercase tracking-widest">Lists</span>
        </button>
      </nav>
    </div>
  );
};

export default GroceryListsView;