import React from 'react';
import { useLinkClickHandler, useNavigate } from 'react-router-dom';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEllipsisVertical,
    faEdit,
    faTrashAlt,
    faCopy,
    faBookmark,
} from '@fortawesome/free-solid-svg-icons';

import RecipeItemIngredients from './RecipeItemIngredients';
import { cloneRecipeDraft } from '../utils/duplicateRecipe.js';

import '../styles/RecipeItem.css';

function RecipeItem(props) {
    const navigate = useNavigate();
    const handleClick = useLinkClickHandler(`/recipes/view/${props.recipe.fbid}`);
    const isFavorite = Boolean(props.recipe.favorited);

    const stopCardClick = (event) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const goToDuplicate = () => {
        const draft = cloneRecipeDraft(props.recipe);
        navigate(`/recipes/add?duplicate=${encodeURIComponent(props.recipe.fbid)}`, {
            state: { duplicateFrom: draft },
        });
    };

  return (
    <div onClick={handleClick} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center shadow-md active:shadow-sm transition-all duration-100 cursor-pointer group">
    
      {/* Text Content */}
      <div className="flex-1 min-w-0 flex flex-col items-start text-left">
        <h3 className="text-lg font-bold text-slate-800 truncate leading-tight w-full">
          {props.recipe.name}
        </h3>
        {isFavorite ? (
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-amber-700/70">
            <FontAwesomeIcon icon={faBookmark} className="text-[10px]" aria-hidden="true" />
            Saved
          </p>
        ) : null}
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5 w-full">
            <div className="text-sm text-slate-500 font-medium truncate w-full mb-1">
                <RecipeItemIngredients ingredients={props.recipe.ingredients} />
            </div>
        </div>
      </div>
    
      <div className="flex items-center gap-1 ml-2 shrink-0" onClick={stopCardClick}>
        <Menu>
          <MenuButton
            type="button"
            aria-label={`More actions for ${props.recipe.name}`}
            className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-all active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <FontAwesomeIcon icon={faEllipsisVertical} className="text-xl" aria-hidden="true" />
          </MenuButton>
          <MenuItems
            anchor="bottom end"
            className="z-[80] w-48 origin-top-right rounded-2xl bg-white py-1 shadow-lg ring-1 ring-slate-200 focus:outline-none"
          >
            {!isFavorite ? (
              <MenuItem>
                <button
                  type="button"
                  onClick={() => navigate(`/recipes/edit/${props.recipe.fbid}`)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-slate-700 data-[focus]:bg-slate-50"
                >
                  <FontAwesomeIcon icon={faEdit} className="w-4 text-brand" aria-hidden="true" />
                  Edit
                </button>
              </MenuItem>
            ) : null}
            <MenuItem>
              <button
                type="button"
                onClick={goToDuplicate}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-slate-700 data-[focus]:bg-slate-50"
              >
                <FontAwesomeIcon icon={faCopy} className="w-4 text-brand" aria-hidden="true" />
                Duplicate
              </button>
            </MenuItem>
            {!isFavorite ? (
              <MenuItem>
                <button
                  type="button"
                  onClick={() => props.setDeleteModalID(props.recipe.fbid)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-red-600 data-[focus]:bg-red-50"
                >
                  <FontAwesomeIcon icon={faTrashAlt} className="w-4" aria-hidden="true" />
                  Delete
                </button>
              </MenuItem>
            ) : null}
          </MenuItems>
        </Menu>
      </div>
    </div>
  );
}

export default RecipeItem;
