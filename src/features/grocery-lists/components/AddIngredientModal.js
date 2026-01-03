import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faChevronDown } from '@fortawesome/free-solid-svg-icons';

const aisles = ["produce", "meat", "dairy", "freezer", "other"];

const AddIngredientModal = ({ isOpen, onClose, onAdd }) => {
    const [newItem, setNewItem] = useState({ name: '', amount: '1', type: 'other' });

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!newItem.name.trim()) return;
        // Map 'other' to empty string to match your existing data logic
        const formattedItem = { 
            ...newItem, 
            type: newItem.type === 'other' ? '' : newItem.type,
            crossed: false 
        };
        onAdd(formattedItem);
        setNewItem({ name: '', amount: '1', type: 'other' }); // Reset form
    };
    
    const onCancel = (e) => {
        setNewItem({ name: '', amount: '1', type: 'other' });
        onClose(e);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-[#1976D2] p-6 text-white text-center">
                    <FontAwesomeIcon icon={faPlus} className="text-2xl mb-2" />
                    <h3 className="text-lg font-bold uppercase tracking-widest">Add Custom Item</h3>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-[14px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Aisle / Category</label>
                        <div className="relative">
                            <select 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none appearance-none focus:border-[#1976D2]"
                                value={newItem.type}
                                onChange={(e) => setNewItem({...newItem, type: e.target.value})}
                            >
                                {aisles.map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <FontAwesomeIcon icon={faChevronDown} size="xs" />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="w-1/3">
                            <label className="text-[14px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Amount</label>
                            <input 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-[#1976D2]"
                                placeholder="1"
                                value={newItem.amount}
                                onChange={(e) => setNewItem({...newItem, amount: e.target.value})}
                            />
                        </div>
                        <div className="w-2/3">
                            <label className="text-[14px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Ingredient</label>
                            <input 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-[#1976D2]"
                                placeholder="Milk"
                                value={newItem.name}
                                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button onClick={onCancel} className="flex-1 py-3 font-bold text-slate-400 uppercase text-xs tracking-widest">Cancel</button>
                        <button onClick={handleSubmit} className="flex-1 py-3 bg-[#1976D2] text-white rounded-xl font-bold shadow-lg uppercase text-xs tracking-widest">
                            Add to List
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddIngredientModal;