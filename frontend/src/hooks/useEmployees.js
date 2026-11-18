import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeeService } from "../services/employeeService";

export const useEmployees = (params = {}) => {
  return useQuery({
    queryKey: ["employees"],
    queryFn: () => employeeService.getEmployees().then((res) => res.data),
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => employeeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["employees"]);
    },
  });
};
