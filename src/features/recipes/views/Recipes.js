import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';

import store from 'store2';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faClipboard, faPaste, faFileImport, faFileExport } from '@fortawesome/free-solid-svg-icons';

import { addRecipesToFirestore } from '../slices/recipesSlice.ts';

import RecipeSearch from '../components/RecipeSearch.js';
import RecipeItem from '../components/RecipeItem.js';
import DeleteModal from '../components/DeleteModal.js';

import { setRecipes, fetchRecipes, selectRecipes, searchRecipes, getRecipesFromFirestore } from '../slices/recipesSlice.ts';

function RecipesList() {
  const [exportRecipesToggle, setExportRecipesToggle] = useState(false);
  const [deleteModalID, setDeleteModalID] = useState(false);
  const [hasLoadedRecipes, setHasLoadedRecipes] = useState(false);

  const fileInputRef = useRef(null);
  
  const { recipes } = useSelector(state => state.recipes);
  const dispatch = useDispatch();

  const handleImport2 = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          console.log('Successfully imported:', importedData);
          handleImport(importedData);
        } catch (error) {
          console.error('Failed to parse JSON:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  useEffect(() => {
    if (!hasLoadedRecipes) {
      dispatch(getRecipesFromFirestore());
      setHasLoadedRecipes(true);
    }
  }, [dispatch]);

  const handleDownload = (text, filename) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    try {
      const storedRecipes = store('recipes');
      if (storedRecipes) {
        const jsonString = JSON.stringify(storedRecipes);
        handleDownload(jsonString);
      } else {
        alert('No recipes to export.');
      }
    } catch (error) {
      console.error('Failed to copy recipes:', error);
      alert('Failed to copy recipes.');
    }
  };

  const handleImport = (parsedRecipes) => {
    try {
      if (Array.isArray(parsedRecipes)) {
        // store('recipes', parsedRecipes);
        // dispatch(setRecipes(parsedRecipes));
        dispatch(addRecipesToFirestore(parsedRecipes))
        alert('Recipes imported successfully!');
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
        <div>
        <button onClick={(e) => { setExportRecipesToggle(!exportRecipesToggle) }} className="mb-4 px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-800">
          <FontAwesomeIcon icon={faFileImport} /> | <FontAwesomeIcon icon={faFileExport} />
        </button>

        {exportRecipesToggle && <span>
          <button
            className="Export text-left ml-2 mb-4 mr-2 px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-800"
            onClick={handleExport}
          >
            Export Recipes <FontAwesomeIcon icon={faFileExport} />
          </button>

          <input
            type="file"
            accept=".txt"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            className="Import text-left px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 active:bg-red-800"
            onClick={handleImport2}
          >
            Import Recipes <FontAwesomeIcon icon={faFileImport} />
          </button>
        </span>}
        
        </div>

        <NavLink to="/recipes/add">
          <button className="mb-4 px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-800">
            Add Recipe <FontAwesomeIcon icon={faPlus} />
          </button>
        </NavLink>
      </div>
      
      
      
      <section className="App-body RecipesList w-full space-y-4">
        {recipes.length === 0 ? (
          <div>No recipes found.</div>
        ) : (
          recipes.map((recipe) => (
            <RecipeItem key={recipe.fbid} recipe={recipe} setDeleteModalID={setDeleteModalID} />
          ))
        )}
      </section>

      {deleteModalID && <DeleteModal deleteModalID={deleteModalID} setDeleteModalID={setDeleteModalID} />}
    </div>
  );
}

export default RecipesList;