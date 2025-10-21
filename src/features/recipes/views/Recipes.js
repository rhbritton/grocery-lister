import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { getAuth } from 'firebase/auth';

import store from 'store2';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faClipboard, faPaste, faFileImport, faFileExport } from '@fortawesome/free-solid-svg-icons';

import { addRecipesToFirestore } from '../slices/recipesSlice.ts';

import RecipeSearch from '../components/RecipeSearch.js';
import RecipeItem from '../components/RecipeItem.js';
import DeleteModal from '../components/DeleteModal.js';

import { setRecipes, fetchRecipes, selectRecipes, searchRecipes, getRecipesFromFirestore } from '../slices/recipesSlice.ts';

function RecipesList(props) {
  const { user } = props;
  const userId = user.uid;

  const [exportRecipesToggle, setExportRecipesToggle] = useState(false);
  const [deleteModalID, setDeleteModalID] = useState(false);

  const fileInputRef = useRef(null);
  
  const { recipes, status, lastVisibleSearch, searchTerm, searchType, allRecipesGrabbed } = useSelector(state => state.recipes);

  const dispatch = useDispatch();

  const loadMore = (e) => {
    if (status === 'loading') {
      console.log('Already loading. Aborting.');
      return;
    }
    
    if (lastVisibleSearch === undefined) {
      console.log('No more recipes to load.');
      return;
    }
    
    dispatch(getRecipesFromFirestore({ 
      userId, 
      existingRecipes: recipes,
      searchTerm,
      searchType,
    }));
  };

  const observerTargetRef = useRef(null);
  const [isCooldown, setIsCooldown] = useState(false);

  useEffect(() => {
    if (allRecipesGrabbed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isCooldown && status !== 'loading') {
          setIsCooldown(true);

          setTimeout(() => {
            loadMore();

            setTimeout(() => {
              setIsCooldown(false);
            }, 1500);
          }, 300);
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      }
    );

    const target = observerTargetRef.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [loadMore, allRecipesGrabbed, isCooldown, status]);

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
    if (status === 'idle' && recipes && recipes.length === 0) {
      dispatch(getRecipesFromFirestore({ resetPagination: true, userId }));
    }
  }, [dispatch, status, recipes.length, userId]);

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
        parsedRecipes = parsedRecipes.map((recipe) => {
          return { ...recipe, userId };
        });
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
      <RecipeSearch userId={userId} />
      
      <div className="">
        {/* <div>
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
        
        </div> */}

        <NavLink to="/recipes/add">
          <button className="mb-4 px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-800">
            Add Recipe <FontAwesomeIcon icon={faPlus} />
          </button>
        </NavLink>
      </div>
      
      <section className="App-body RecipesList w-full space-y-4">
        {recipes ? recipes.length && recipes.map((recipe) => (
          <RecipeItem key={recipe.fbid} recipe={recipe} setDeleteModalID={setDeleteModalID} />
        )) : recipes.length === 0 && <div>No recipes found.</div>}

        {!allRecipesGrabbed && searchType === 'Name' && status !== 'loading' && recipes.length !== 0 &&
          <div onClick={loadMore}>Load More</div>
        }

        {!allRecipesGrabbed && searchType === 'Name' && (
          <div
            ref={observerTargetRef}
            style={{ height: '1px' }}
          />
        )}
      </section>

      {deleteModalID && <DeleteModal deleteModalID={deleteModalID} setDeleteModalID={setDeleteModalID} />}
    </div>
  );
}

export default RecipesList;