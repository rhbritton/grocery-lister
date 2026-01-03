import React, { useState, useEffect } from 'react';

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

import { findSelectedOption } from '../../recipes/slices/recipeSlice.ts';

function GroceryListViewItem(props) {
    const { ingredient, recipe, crossed } = props.ingredient;

    return (
        <div id={props.itemId} className={`GroceryListViewItem flex items-stretch group transition-all duration-500
                ${crossed ? 'bg-slate-200/40' : props.isEven ? 'bg-white' : 'bg-blue-50/50'}`}>
            
            {/* 1. CHECK ZONE */}
            <button 
                onClick={() => props.onUpdate({ crossed: !crossed })}
                className={`w-14 shrink-0 flex items-center justify-center transition-all duration-500
                ${crossed ? 'bg-slate-200/40' : props.isEven ? 'bg-slate-50' : 'bg-blue-50/50'}`}
            >
                <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all shadow-sm z-40
                ${crossed ? 'bg-[#1976D2] border-[#1976D2] scale-110' : 'bg-white border-slate-300'}`}>
                    {crossed && <FontAwesomeIcon icon={faCheck} className="text-white text-xs" />}
                    {!crossed && <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-blue-200 transition-colors" />}
                </div>
            </button>
            
            {/* 2. TEXT CONTENT ZONE */}
            <div className="flex-1 text-left pl-5 pr-2 py-5 cursor-pointer relative z-40" onClick={() => props.onUpdate({ crossed: !crossed })}>
                <p className={`text-base font-bold transition-all duration-300
                    ${crossed ? 'text-slate-400 line-through decoration-slate-400 decoration-2' : 'text-slate-800'}`}>
                    <span className={`text-[14px] mr-1 font-black uppercase tracking-widest ${crossed ? 'text-slate-300' : 'text-[#1976D2]'}`}>
                        {ingredient.amount}
                    </span>
                    {ingredient.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[14px] font-black uppercase tracking-widest ${crossed ? 'text-slate-200' : 'text-slate-400'}`}>
                        {recipe?.name || 'Custom Item'}
                    </span>
                </div>
            </div>
            
            {/* 3. EDIT ACTION ZONE */}
            <div className="flex items-center pr-4 relative z-40">
                <button 
                    onClick={(e) => { e.stopPropagation(); props.onEdit(); }}
                    className={`w-10 h-10 flex items-center justify-center transition-all duration-200 rounded-xl
                        ${crossed 
                            ? 'opacity-0 pointer-events-none' // Hide edit when crossed to declutter
                            : 'text-slate-400 hover:text-[#1976D2] hover:bg-blue-50 active:scale-90 bg-slate-50/50 border border-transparent hover:border-blue-100'
                        }`}
                >
                    <FontAwesomeIcon icon={faEdit} className="text-lg" />
                </button>
            </div>
        </div>
    );
}

export default GroceryListViewItem;