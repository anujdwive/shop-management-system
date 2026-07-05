import { useMutation, useQuery } from '@tanstack/react-query';
import { authService } from './authService';
import { useDispatch } from 'react-redux';
import { loginSuccess, loginFailure, loginStart, logout } from '../store/slices/authSlice';

export const useLogin = () => {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: authService.login,
    onMutate: () => {
      dispatch(loginStart());
    },
    onSuccess: (response) => {
      dispatch(loginSuccess({
        user: response.data,
        token: response.data.token,
      }));
      return response.data;
    },
    onError: (error) => {
      dispatch(loginFailure(error.response?.data?.message || 'Login failed'));
    },
  });
};

export const useRegister = () => {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: authService.register,
    onMutate: () => {
      dispatch(loginStart());
    },
    onSuccess: (response) => {
      dispatch(loginSuccess({
        user: response.data,
        token: response.data.token,
      }));
      return response.data;
    },
    onError: (error) => {
      dispatch(loginFailure(error.response?.data?.message || 'Registration failed'));
    },
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: authService.getCurrentUser,
    enabled: !!localStorage.getItem('token'),
    retry: false,
  });
};

export const useLogout = () => {
  const dispatch = useDispatch();

  return () => {
    dispatch(logout());
    // Clear all React Query cache
    window.location.href = '/login';
  };
};