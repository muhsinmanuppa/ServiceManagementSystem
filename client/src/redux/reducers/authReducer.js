import { FETCH_USER_SUCCESS, FETCH_USER_FAILURE } from '../actions/types';

const initialState = {
  user: null,
  isAuthenticated: false,
  error: null,
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_USER_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        error: null,
      };
    case FETCH_USER_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        error: action.payload,
      };
    // ...existing code...
    default:
      return state;
  }
};

export default authReducer;
