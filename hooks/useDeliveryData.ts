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
}

interface DeliveryResponse {
  message: string;
  count: number;
  data: DeliveryData[];
}

export default function useDeliveryData(lineUserId: string | null) {
  return useQuery<DeliveryResponse>({
    queryKey: ["delivery", lineUserId],
    queryFn: async () => {
      if (!lineUserId) {
        throw new Error("Line User ID is required");
      }

      const response = await axios.get("/api/find", {
        params: {
          line_user_id: lineUserId,
        },
      });

      return response.data;
    },
    enabled: !!lineUserId, // Only run query if lineUserId exists
    retry: 1,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}
