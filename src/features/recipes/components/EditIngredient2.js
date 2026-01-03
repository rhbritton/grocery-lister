import React, { useState } from 'react';

import Select from 'react-select';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUtensils,
  faTrashAlt, 
  faTag, 
  faHashtag
} from '@fortawesome/free-solid-svg-icons';

function EditIngredient(props) {
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
                        options={props.typeOptions}
                        value={props.findSelectedOption(props.ingredient.type)}
                        onChange={(selectedOption) => {
                            props.handleIngredientChange(props.index, 'type', selectedOption.value);
                        }}
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
                    value={props.ingredient.name}
                    onChange={(e) => props.handleIngredientChange(props.index, 'name', e.target.value)}
                    className="w-full bg-[#f8fafc] rounded-xl px-4 py-3 text-base font-bold border outline-none transition-all focus:border-[#1976D2] focus:ring-4 focus:ring-blue-500/10 focus:bg-white"
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