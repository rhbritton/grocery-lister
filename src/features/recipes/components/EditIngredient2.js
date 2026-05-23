import React from 'react';

import Select from 'react-select';
import { createReactSelectStyles } from '../../../utils/reactSelectStyles.js';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUtensils,
  faTrashAlt, 
  faTag, 
  faHashtag
} from '@fortawesome/free-solid-svg-icons';

function EditIngredient(props) {
    const selectStyles = createReactSelectStyles({ fontSize: '14px', multiValueLabelSize: '12px', menuPortalZIndex: 9999 });

  return (
    <div 
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
                        value={props.ingredient.amount}
                        onChange={(e) => props.handleIngredientChange(props.index, 'amount', e.target.value)}
                        className="w-full bg-[#f8fafc] rounded-xl px-4 py-3 text-base font-bold border outline-none transition-all focus:border-brand focus:ring-4 focus:ring-blue-500/10 focus:bg-white"
                        placeholder="1 cup"
                    />
                </div>

                {/* Aisle / Category Field */}
                <div className="flex-1 relative">
                    <label className="absolute -top-2 left-3 px-1 bg-white z-10 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                        <FontAwesomeIcon icon={faTag} className="text-[8px]" /> Aisle
                    </label>
                    <Select 
                        options={props.typeOptions}
                        value={props.findSelectedOption(props.ingredient.type)}
                        onChange={(selectedOption) => {
                            props.handleIngredientChange(props.index, 'type', selectedOption.value);
                        }}
                        styles={selectStyles}
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
                    value={props.ingredient.name}
                    onChange={(e) => props.handleIngredientChange(props.index, 'name', e.target.value)}
                    className="w-full bg-[#f8fafc] rounded-xl px-4 py-3 text-base font-bold border outline-none transition-all focus:border-brand focus:ring-4 focus:ring-blue-500/10 focus:bg-white"
                    placeholder="Tomatoes, diced"
                />
            </div>
        </div>

        {/* 2. Vertically Centered Delete Button */}
        {/* Adjusted mt-4: Since the stack is tighter, the vertical center shift is slightly less */}
        <div className="shrink-0 self-center mt-4"> 
            <button 
                onClick={() => props.handleRemoveIngredient(props.index)}
                className="w-14 h-14 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-90 active:bg-red-100"
            >
                <FontAwesomeIcon icon={faTrashAlt} className="text-xl" />
            </button>
        </div>
    </div>
  );
}

export default EditIngredient;