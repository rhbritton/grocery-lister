import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faChevronDown } from '@fortawesome/free-solid-svg-icons';

import { fetchRecipes, selectRecipes, searchRecipes, getRecipesFromFirestore } from '../slices/recipesSlice.ts';

function RecipeSearch(props) {
    const { userId } = props;
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('Name');
    const dispatch = useDispatch();

    useEffect(() => {
        handleSearch();
    }, [searchType]);

    const handleSearch = () => {
        const debouncedSearch = setTimeout(() => {
            // dispatch(searchRecipes(searchTerm));
            // dispatch(searchRecipes({ searchString: searchTerm, searchType: searchType }));
            dispatch(getRecipesFromFirestore({ userId, searchTerm: searchTerm, searchType: searchType }));
        }, 250);

        return () => clearTimeout(debouncedSearch);
    };

    return (
        <div className="RecipeSearch flex items-center space-x-4 mb-4">
    <div className="flex items-center bg-white border border-gray-300 rounded-md flex-grow">
        <div className="relative inline-block text-gray-700">
            <select
                name="searchType"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
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
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyUp={(e) => handleSearch()}
        />
        <button onClick={() => handleSearch()} className="px-4 py-2 rounded-r-md bg-blue-500 text-white hover:bg-blue-600">
            <FontAwesomeIcon icon={faMagnifyingGlass} /> Search
        </button>
    </div>
</div>
    );
}

export default RecipeSearch;