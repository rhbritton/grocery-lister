// src/redux/reducers/index.js
import { combineReducers } from 'redux';
import recipeReducer from './recipeReducer';
import groceryListReducer from './groceryListReducer';
import authReducer from './authReducer'; // Import the auth reducer

const rootReducer = combineReducers({
  recipes: recipeReducer,
  groceryList: groceryListReducer,
  auth: authReducer, // Add the auth reducer
});

export default rootReducer;