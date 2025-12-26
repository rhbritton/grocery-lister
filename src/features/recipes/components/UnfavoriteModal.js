import React from 'react';

function UnfavoriteModal({ setShowModal, onConfirm }) {
  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" 
      onClick={() => setShowModal(false)}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-4">Remove Favorite</h2>
        <p className="mb-6">Are you sure you want to remove this recipe from your favorites?</p>
        <div className="flex justify-end">
          <button 
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
            onClick={() => setShowModal(false)}
          >
            Cancel
          </button>
          <button 
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => {
              onConfirm();
              setShowModal(false);
            }}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export default UnfavoriteModal;