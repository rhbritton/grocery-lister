import React from 'react';
import { NavLink, useLinkClickHandler, useNavigate } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faTrash } from '@fortawesome/free-solid-svg-icons';

import { formatDate, formatTime } from '../../../services/date.js';

import '../styles/GroceryListItem.css';

function GroceryListItem(props) {
    const handleViewClick = useLinkClickHandler(`/grocery-lists/view/${props.gl.fbid}`);
    const handleEditClick = useLinkClickHandler(`/grocery-lists/edit/${props.gl.fbid}`);

    return (
        <div onClick={handleViewClick} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center shadow-md active:shadow-sm transition-all duration-100 cursor-pointer group">
            <div className="flex-1 min-w-0 flex flex-col items-start text-left">
                <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-black text-slate-800 leading-tight">
                    {formatDate(new Date(props.gl.timestamp))}
                </h3>
                <span className="text-[14px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                    {formatTime(new Date(props.gl.timestamp), { hour: 'numeric', minute: 'numeric'})}
                </span>
                </div>
                
                <p className="text-sm text-slate-500 font-medium truncate w-full mb-1">
                    {props.gl.recipes.map((r) => r?.recipe?.name.trim()).join(', ')}
                </p>
                
                <span className="text-[14px] font-black px-2 py-0.5 rounded uppercase tracking-widest text-[#1976D2] bg-blue-50">
                    {/* {list.itemCount} Items */}
                </span>
            </div>

            {/* Action Icons */}
            <div className="flex items-center gap-1 ml-2 shrink-0">
                <button onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        props.setDeleteModalID(props.gl.fbid);
                    }}
                    className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all active:scale-90"
                >
                    <FontAwesomeIcon icon={faTrashAlt} className="text-xl" />
                </button>
            </div>
        </div>
    );
}

export default GroceryListItem;