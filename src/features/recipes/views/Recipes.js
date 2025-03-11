import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';

import store from 'store2';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faClipboard, faPaste, faFileImport, faFileExport } from '@fortawesome/free-solid-svg-icons';

import RecipeSearch from '../components/RecipeSearch.js';
import RecipeItem from '../components/RecipeItem.js';
import DeleteModal from '../components/DeleteModal.js';

import { fetchRecipes, selectRecipes, searchRecipes } from '../slices/recipesSlice.ts';

function RecipesList() {
  const [exportRecipesToggle, setExportRecipesToggle] = useState(false);
  const [deleteModalID, setDeleteModalID] = useState(false);
  const [importText, setImportText] = useState('');
  
  const recipes = useSelector((state) => selectRecipes(state));
  const dispatch = useDispatch();

  // initial load
  useEffect(() => {
    if (recipes.length === 0) {
      const storedRecipes = store('recipes');

      if (storedRecipes) {
        dispatch(fetchRecipes(storedRecipes));
      } else {
        dispatch(fetchRecipes([]));
      }
    }
  }, []);

  const handleExport = () => {
    try {
      const storedRecipes = store('recipes');
      if (storedRecipes) {
        const jsonString = JSON.stringify(storedRecipes);
        navigator.clipboard.writeText(jsonString);
        alert('Recipes copied to clipboard!');
      } else {
        alert('No recipes to export.');
      }
    } catch (error) {
      console.error('Failed to copy recipes:', error);
      alert('Failed to copy recipes.');
    }
  };

  const handleImport = () => {
    try {
      const parsedRecipes = JSON.parse(importText);
      if (Array.isArray(parsedRecipes)) {
        store('recipes', parsedRecipes);
        dispatch(fetchRecipes(parsedRecipes));
        alert('Recipes imported successfully!');
        setImportText(''); // Clear import text after successful import
      } else {
        alert('Invalid data format.');
      }
    } catch (error) {
      console.error('Failed to import recipes:', error);
      alert('Failed to import recipes.');
    }
  };

  return (
    <div>
      <RecipeSearch />
      
      <div className="flex justify-between">
        <button onClick={(e) => { setExportRecipesToggle(!exportRecipesToggle) }} className="mb-4 px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-800">
          <FontAwesomeIcon icon={faFileImport} /> | <FontAwesomeIcon icon={faFileExport} />
        </button>

        <NavLink to="/recipes/add">
          <button className="mb-4 px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-800">
            Add Recipe <FontAwesomeIcon icon={faPlus} />
          </button>
        </NavLink>
      </div>
      
      {exportRecipesToggle && <div className="mb-4">
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Paste exported recipes here to overwrite your recipe data..."
          className="w-full h-32 p-2 border rounded"
        />
        <button
          className="Export mb-4 mr-2 mt-2 px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-800"
          onClick={handleExport}
        >
          Export Recipes <FontAwesomeIcon icon={faFileExport} />
        </button>
        <button
          className="Import px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 active:bg-red-800"
          onClick={handleImport}
        >
          Import Recipes <FontAwesomeIcon icon={faFileImport} />
        </button>
      </div>}
      
      <section className="RecipesList w-full space-y-4">
        {recipes.length === 0 ? (
          <div>No recipes found.</div>
        ) : (
          recipes.map((recipe) => (
            <RecipeItem key={recipe.id} recipe={recipe} setDeleteModalID={setDeleteModalID} />
          ))
        )}
      </section>

      {deleteModalID && <DeleteModal deleteModalID={deleteModalID} setDeleteModalID={setDeleteModalID} />}
    </div>
  );
}

export default RecipesList;