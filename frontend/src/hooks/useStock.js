import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { stockService } from "../services/stockService";

export const useStock = (shopId) => {
  return useQuery({
    queryKey: ["stock", shopId ?? null],
    queryFn: () =>
      stockService.getAll(shopId ? { shopId } : {}).then((res) => res.data),
  });
};

export const useAdjustStock = (data) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => stockService.adjust(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["stock"]);
    },
  });
};

export const useLowStockAlerts = (shopId) => {
  return useQuery({
    queryKey: ["lowStock", shopId],
    queryFn: () =>
      stockService.getLowStockAlerts(shopId).then((res) => res.data),
    enabled: !!shopId,
  });
};
