const initialState = {
    isAuthenticated: false,
    user: null,
  };
  
  // Action Types
  export const SET_AUTH_STATUS = 'SET_AUTH_STATUS';
  export const SET_USER = 'SET_USER';
  
  const authReducer = (state = initialState, action) => {
    switch (action.type) {
      case SET_AUTH_STATUS:
        return {
          ...state,
          isAuthenticated: action.payload,
        };
      case SET_USER:
        return {
          ...state,
          user: action.payload,
        };
      default:
        return state;
    }
  };
  
  export default authReducer;