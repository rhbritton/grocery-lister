import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faChevronDown } from '@fortawesome/free-solid-svg-icons';

import { fetchRecipes, selectRecipes, searchRecipes, getRecipesFromFirestore, setRecipeSearchParams } from '../slices/recipesSlice.ts';

function RecipeSearch(props) {
    const { userId } = props;
    const dispatch = useDispatch();
    
    const { searchTerm, searchType } = useSelector(state => state.recipes);
    
    const debouncedSearchRef = useRef(null); 
    const handleSearch = (termToSearch, typeToSearch) => {
        clearTimeout(debouncedSearchRef.current);
        debouncedSearchRef.current = setTimeout(() => {
            // dispatch(searchRecipes(searchTerm));
            // dispatch(searchRecipes({ searchString: searchTerm, searchType: searchType }));
            if (termToSearch.trim().length != 1)
                dispatch(getRecipesFromFirestore({ resetPagination: true, userId, searchTerm: termToSearch, searchType: typeToSearch }));
        }, 500);
    };

    return (
        <div className="RecipeSearch flex items-center space-x-4 mb-2 px-2">
    <div className="flex items-center bg-white border border-gray-300 rounded-md flex-grow">
        <div className="relative inline-block text-gray-700">
            <select
                name="searchType"
                value={searchType}
                onChange={(e) => {
                    const newType = e.target.value;
                    dispatch(setRecipeSearchParams({ searchTerm: searchTerm, searchType: newType }));
                    handleSearch(searchTerm, newType); 
                }}
                className="block appearance-none bg-white py-2 pl-3 pr-8 rounded-l-md outline-none cursor-pointer border-r border-gray-300"
            >
                <option value="Name">Name</option>
                <option value="Ingredient">Ingredient</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FontAwesomeIcon icon={faChevronDown} />
            </div>
        </div>
        <input
            name="searchTerm"
            type="text"
            placeholder="Search recipes..."
            className="flex-grow px-3 py-2 outline-none"
            value={searchTerm}
            onChange={(e) => {
                const newTerm = e.target.value;
                dispatch(setRecipeSearchParams({ searchTerm: newTerm, searchType: searchType }));
                handleSearch(newTerm, searchType); 
            }}
        />
        <button onClick={() => { handleSearch(searchTerm, searchType); }} className="px-4 py-2 rounded-r-md bg-blue-500 text-white hover:bg-blue-600">
            <FontAwesomeIcon icon={faMagnifyingGlass} /> Search
        </button>
    </div>
</div>
    );
}

export default RecipeSearch;