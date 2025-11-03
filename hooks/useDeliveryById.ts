import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface DeliveryData {
  _id: string;
  customerName: string;
  line_user_id: string;
  phone: string;
  addressDetails: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
  slipImageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

interface DeliveryByIdResponse {
  message: string;
  data: DeliveryData;
}

export default function useDeliveryById(id: string | null) {
  return useQuery<DeliveryByIdResponse>({
    queryKey: ["delivery", id],
    queryFn: async () => {
      if (!id) {
        throw new Error("Delivery ID is required");
      }

      const response = await axios.get(`/api/delivery/${id}`);

      return response.data;
    },
    enabled: !!id, // Only run query if id exists
    retry: 1,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}
