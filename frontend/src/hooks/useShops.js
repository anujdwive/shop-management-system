import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { shopService } from "../services/shopService";

export const useShops = ({ search, limit, page }) => {
  return useQuery({
    queryKey: ["shops", { search, limit, page }],
    queryFn: () =>
      shopService
        .getAll({
          search,
          limit,
          page,
        })
        .then((res) => res.data),
  });
};

export const useShopOptions = () => {
  return useQuery({
    queryKey: ["shopOptions"],
    queryFn: () => shopService.getAllShopOptions().then((res) => res.data),
  });
};

export const useShop = (id) => {
  return useQuery({
    queryKey: ["shop", id],
    queryFn: () => shopService.getById(id).then((res) => res.data),
    enabled: !!id,
  });
};

export const useCreateShop = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => shopService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["shops"]);
    },
  });
};

export const useUpdateShop = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => shopService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["shops"]);
    },
  });
};

export const useDeleteShop = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => shopService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["shops"]);
    },
  });
};
