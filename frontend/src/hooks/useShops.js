import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shopService } from '../services/shopService';

export const useShops = () => {
  return useQuery({
    queryKey: ['shops'],
    queryFn: () => shopService.getAll().then((res) => res.data),
  });
};

export const useShop = (id) => {
  return useQuery({
    queryKey: ['shop', id],
    queryFn: () => shopService.getById(id).then((res) => res.data),
    enabled: !!id,
  });
};

export const useCreateShop = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => shopService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shops']);
    },
  });
};

export const useUpdateShop = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => shopService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shops']);
    },
  });
};

export const useDeleteShop = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => shopService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['shops']);
    },
  });
};