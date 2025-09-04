// src/redux/reducers/index.js
import { combineReducers } from 'redux';
import recipeReducer from './recipeReducer';
import groceryListReducer from './groceryListReducer';

const rootReducer = combineReducers({
  recipes: recipeReducer,
  groceryList: groceryListReducer
});

export default rootReducer;