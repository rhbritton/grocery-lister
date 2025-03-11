import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

import { fetchRecipes, selectRecipes, searchRecipes } from '../slices/recipesSlice.ts';

function RecipeSearch(props) {
    const [searchTerm, setSearchTerm] = useState('');
    const dispatch = useDispatch();

    const handleSearch = () => {
        const debouncedSearch = setTimeout(() => {
            dispatch(searchRecipes(searchTerm));
        }, 250);

        return () => clearTimeout(debouncedSearch);
    };

  return (
    <div className="RecipeSearch flex items-center space-x-4 mb-4">
        <div className="flex items-center bg-white border border-gray-300 rounded-md px-3 py-1 flex-grow">
            <input
                type="text"
                placeholder="Search recipes..."
                className="flex-grow outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyUp={(e) => handleSearch()}
            />

            <button onClick={handleSearch} className="px-2 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600">
                <FontAwesomeIcon icon={faMagnifyingGlass} /> Search
            </button>
        </div>
    </div>
  );
}

export default RecipeSearch;