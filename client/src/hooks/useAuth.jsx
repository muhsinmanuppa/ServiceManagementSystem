import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { fetchUser } from '../redux/actions/authActions';

export const useAuth = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      if (!user && !initialized) {
        await dispatch(fetchUser());
        setInitialized(true);
      } else if (!initialized) {
        setInitialized(true);
      }
    };

    initAuth();
  }, [dispatch, user, initialized]);

  return { user, isAuthenticated, initialized };
};