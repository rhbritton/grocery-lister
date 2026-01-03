import React from 'react';
import { NavLink, useLinkClickHandler, useNavigate } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faPenToSquare, 
    faTrash, 
    faHeart as faHeartSolid,
    faEdit,
    faTrashAlt,
    faBookmark,
    faBook
} from '@fortawesome/free-solid-svg-icons';

import RecipeItemIngredients from './RecipeItemIngredients';

import '../styles/RecipeItem.css';

function RecipeItem(props) {
    const navigate = useNavigate();
    const handleClick = useLinkClickHandler(`/recipes/view/${props.recipe.fbid}`);

  return (
    <div onClick={handleClick} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center shadow-md active:shadow-sm transition-all duration-100 cursor-pointer group">
    
      {/* Text Content */}
      <div className="flex-1 min-w-0 flex flex-col items-start text-left">
        <h3 className="text-lg font-bold text-slate-800 truncate leading-tight w-full">
          {props.recipe.name}
        </h3>
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5 w-full">
           {/* <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider 
             ${props.recipe.favorited 
               ? 'text-amber-700 bg-amber-50' 
               : 'text-blue-600 bg-blue-50'
             }`}
           >
              {props.recipe.category}
           </span> */}

            <div className="text-sm text-slate-500 font-medium truncate w-full mb-1">
                <RecipeItemIngredients ingredients={props.recipe.ingredients} />
            </div>
           
           {/* <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
              <span>• {props.recipe.prepTime}</span>
              
              {props.recipe.favorited && props.recipe.savedName && (
                <span className="flex items-center gap-1">
                  <span className="opacity-60">•</span>
                  <span>By <span className="text-slate-600 font-semibold">{props.recipe.savedName}</span></span>
                </span>
              )}
           </span> */}
        </div>
      </div>
    
      {/* Action Icons - Hidden if Saved */}
      <div className="flex items-center gap-1 ml-2 shrink-0">
        {!props.recipe.favorited && (
          <>
            {props.recipe.favorited || <button onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    navigate('/recipes/edit/'+props.recipe.fbid);
                }} className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all active:scale-90">
              <FontAwesomeIcon icon={faEdit} className="text-xl" />
            </button>}
            {props.recipe.favorited || <button onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    props.setDeleteModalID(props.recipe.fbid);
                }} className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all active:scale-90">
              <FontAwesomeIcon icon={faTrashAlt} className="text-xl" />
            </button>}
          </>
        )}
        {props.recipe.favorited && (
          <>
            {/* Left Icon Block */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 
              ${props.recipe.favorited 
                ? 'bg-amber-50' 
                : 'bg-blue-50'
              }`}
            >
              <FontAwesomeIcon 
                icon={props.recipe.favorited ? faBookmark : faBook} 
                className={`text-lg transition-colors duration-300 
                  ${props.recipe.favorited 
                    ? 'text-amber-600' 
                    : 'text-[#1976D2]'
                  }`} 
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default RecipeItem;