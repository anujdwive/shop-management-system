import { useQuery } from '@tanstack/react-query';
import { stockService } from '../services/stockService';

export const useStock = (shopId) => {
  return useQuery({
    queryKey: ['stock', shopId],
    queryFn: () => stockService.getByShop(shopId).then((res) => res.data),
    enabled: !!shopId,
  });
};

export const useLowStockAlerts = (shopId) => {
  return useQuery({
    queryKey: ['lowStock', shopId],
    queryFn: () => stockService.getLowStockAlerts(shopId).then((res) => res.data),
    enabled: !!shopId,
  });
};