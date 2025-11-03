import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface ZipLocationResult {
  zip_code?: string;
  tambon_name_th?: string;
  tambon_name_en?: string;
  amphoe_name_th?: string;
  amphoe_name_en?: string;
  province_name_th?: string;
  province_name_en?: string;
  tambon_id?: number;
  amphoe_id?: number;
  province_id?: number;
}

interface UseZipLocationOptions {
  limit?: number;
}

/**
 * useZipLocation
 * - ค้นหารหัสไปรษณีย์เท่านั้น โดยไม่กรอง province/amphoe
 * - เหมาะสำหรับการค้นหารหัสไปรษณีย์แบบอิสระ ไม่ขึ้นกับข้อมูลพื้นที่อื่น
 * - Returns: รายการรหัสไปรษณีย์พร้อมข้อมูลพื้นที่ที่เกี่ยวข้อง
 */
export function useZipLocation(zipCode: string, options: UseZipLocationOptions = {}) {
  const { limit = 100 } = options;

  // เปิดใช้งานเมื่อมี zipCode ที่ค้นหาเท่านั้น
  const enabled = Boolean(zipCode && zipCode.trim().length > 0);

  return useQuery({
    queryKey: ["zipLocation", zipCode, limit],
    queryFn: async () => {
      const searchTerm = zipCode.trim();

      if (!searchTerm) return [];

      try {
        // ค้นหารหัสไปรษณีย์โดยไม่มีการกรองพื้นที่
        const query = supabase.from("zip_code_view").select("*").ilike("zip_code", `${searchTerm}%`).limit(limit);

        const { data, error } = await query;

        if (error) {
          console.error("useZipLocation error:", error);
          throw error;
        }

        return data ?? [];
      } catch (err) {
        console.error("useZipLocation error:", err);
        return [];
      }
    },
    enabled,
    staleTime: 60000, // Cache for 1 minute
  });
}

export default useZipLocation;
