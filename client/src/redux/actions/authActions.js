import axios from 'axios';
import { FETCH_USER_SUCCESS, FETCH_USER_FAILURE, FETCH_USER_REQUEST } from './types';

export const fetchUser = () => async (dispatch) => {
  try {
    dispatch({ type: FETCH_USER_REQUEST });
    const response = await axios.get('/api/auth/user');
    return dispatch({ type: FETCH_USER_SUCCESS, payload: response.data });
  } catch (error) {
    return dispatch({ type: FETCH_USER_FAILURE, payload: error.message });
  }
};
