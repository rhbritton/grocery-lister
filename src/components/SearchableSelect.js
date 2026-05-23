import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faBookmark, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';

const SearchableSelect = ({ 
  options = [], 
  selectedItems = [], 
  onChange, 
  placeholder = "Select recipes...",
  valueKey = "value",
  labelKey = "label",
  isFavoriteKey = "isFavorite"
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false); 
  
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filteredOptions = useMemo(() => {
    return options.filter(option => {
      const matchesSearch = String(option[labelKey]).toLowerCase().includes(query.toLowerCase());
      const isAlreadySelected = selectedItems.some(item => String(item[valueKey]) === String(option[valueKey]));
      return matchesSearch && !isAlreadySelected;
    });
  }, [query, options, labelKey, selectedItems, valueKey]);

  const handleContainerClick = (e) => {
    inputRef.current?.focus();

    if (query.length > 0) {
        setIsOpen(true);
    } else {
        setIsOpen(!isOpen);
    }
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const handleAdd = (option) => {
    const newSelection = [...selectedItems, option];
    onChange(newSelection);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemove = (e, value) => {
    e.stopPropagation();
    const newSelection = selectedItems.filter(item => String(item[valueKey]) !== String(value));
    onChange(newSelection);
  };

  return (
    <div ref={wrapperRef} className="w-full flex flex-col relative">
      <div 
        onClick={handleContainerClick}
        className={`relative min-h-[56px] w-full bg-[#f8fafc] rounded-xl border p-2 flex flex-wrap gap-2 items-center cursor-text transition-all ${
          isOpen ? 'border-brand ring-4 ring-blue-500/10' : 'border-slate-500'
        }`}
      >
        {selectedItems.map((item) => (
          <div 
            key={String(item[valueKey])}
            className="flex items-center gap-2 bg-blue-100 text-brand font-bold pl-3 pr-2 py-1.5 rounded-lg border border-blue-200 animate-in fade-in zoom-in duration-200"
          >
            {item[isFavoriteKey] && (
              <FontAwesomeIcon icon={faBookmark} className="text-sm shrink-0" />
            )}
            <span className="text-sm truncate max-w-[150px]">
              {item[labelKey]}
            </span>
            <button
              type="button"
              onClick={(e) => handleRemove(e, item[valueKey])}
              className="hover:bg-blue-200 w-5 h-5 flex items-center justify-center rounded-full transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} className="text-[14px]" />
            </button>
          </div>
        ))}

        <div className="flex-1 min-w-[120px] relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder={selectedItems.length === 0 ? placeholder : ""}
            className="w-full bg-transparent py-1 px-2 text-[18px] font-bold text-slate-800 outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="pr-4 text-slate-400 cursor-pointer pointer-events-none">
          <FontAwesomeIcon 
            icon={faChevronDown} 
            className={`transition-transform duration-200`} 
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-[220px] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="divide-y divide-slate-100">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={String(option[valueKey])}
                  type="button"
                  onClick={() => handleAdd(option)}
                  className="w-full flex items-center py-3.5 px-4 transition-colors text-left bg-white hover:bg-slate-50 active:bg-slate-100"
                >
                  <div className="flex items-center gap-3 w-full">
                    {option[isFavoriteKey] && (
                      <FontAwesomeIcon icon={faBookmark} className="text-amber-600 text-sm shrink-0" />
                    )}
                    <span className="text-[18px] truncate text-slate-700 font-bold">
                      {option[labelKey]}
                    </span>
                    
                    <div className="ml-auto text-slate-300">
                      <FontAwesomeIcon icon={faPlus} className="text-sm" />
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="py-6 text-center text-slate-400 italic text-sm">
                {query ? "No results found" : "Type to search..."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;