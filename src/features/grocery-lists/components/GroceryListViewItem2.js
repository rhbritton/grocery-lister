import React from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEdit, 
  faCheck, 
} from '@fortawesome/free-solid-svg-icons';

function GroceryListViewItem(props) {
    const { ingredient, recipe, crossed } = props.ingredient;
    const disableCheck = props.disableCheck;
    const checkLabel = crossed
      ? `Uncheck ${ingredient.name}`
      : `Check off ${ingredient.name}`;

    const handleToggle = () => {
        if (disableCheck) return;
        props.onUpdate({ crossed: !crossed });
    };

    return (
        <div id={props.itemId} className={`GroceryListViewItem flex items-stretch group transition-all duration-500
                ${crossed ? 'bg-slate-200/40' : props.isEven ? 'bg-white' : 'bg-blue-50/50'}
                ${disableCheck ? 'opacity-80' : ''}`}>
            
            <button 
                type="button"
                onClick={handleToggle}
                disabled={disableCheck}
                aria-label={checkLabel}
                aria-pressed={!!crossed}
                aria-disabled={disableCheck}
                className={`w-14 shrink-0 flex items-center justify-center transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset
                ${crossed ? 'bg-slate-200/40' : props.isEven ? 'bg-slate-50' : 'bg-blue-50/50'}
                ${disableCheck ? 'cursor-not-allowed' : ''}`}
            >
                <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all shadow-sm z-40
                ${crossed ? 'bg-brand border-brand scale-110' : disableCheck ? 'bg-slate-100 border-slate-200' : 'bg-white border-slate-300'}`}>
                    {crossed && <FontAwesomeIcon icon={faCheck} className="text-white text-xs" aria-hidden="true" />}
                    {!crossed && !disableCheck && <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-blue-200 transition-colors" aria-hidden="true" />}
                </div>
            </button>
            
            <button
                type="button"
                onClick={handleToggle}
                disabled={disableCheck}
                aria-disabled={disableCheck}
                className={`flex-1 text-left pl-5 pr-2 py-5 relative z-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset
                ${disableCheck ? 'cursor-default' : ''}`}
            >
                <p className={`text-base font-bold transition-all duration-300
                    ${crossed ? 'text-slate-400 line-through decoration-slate-400 decoration-2' : 'text-slate-800'}`}>
                    <span className={`text-[14px] mr-1 font-black uppercase tracking-widest ${crossed ? 'text-slate-300' : 'text-brand'}`}>
                        {ingredient.amount}
                    </span>
                    {ingredient.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[14px] font-black uppercase tracking-widest ${crossed ? 'text-slate-200' : 'text-slate-400'}`}>
                        {recipe?.name || 'Custom Item'}
                    </span>
                </div>
            </button>
            
            {!props.disableEdit && (
              <div className="flex items-center pr-4 relative z-40">
                <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); props.onEdit(); }}
                    aria-label={`Edit ${ingredient.name}`}
                    className={`min-w-touch min-h-touch flex items-center justify-center transition-all duration-200 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand
                        ${crossed 
                            ? 'opacity-0 pointer-events-none'
                            : 'text-slate-400 hover:text-brand hover:bg-blue-50 active:scale-90 bg-slate-50/50 border border-transparent hover:border-blue-100'
                        }`}
                >
                    <FontAwesomeIcon icon={faEdit} className="text-lg" aria-hidden="true" />
                </button>
            </div>
            )}
        </div>
    );
}

export default GroceryListViewItem;
