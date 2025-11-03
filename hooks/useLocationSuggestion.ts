import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

type SuggestionType = "province" | "amphoe" | "tambon" | "zip";

interface Options {
  type?: SuggestionType;
  provinceId?: number; // province ID filter
  amphoeId?: number; // amphoe ID filter
  tambonId?: number; // tambon ID filter
  limit?: number;
}

export interface LocationResult {
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

/**
 * useLocationSuggestion
 * - Uses Supabase to query the `zip_code_view` view or `provinces` table.
 * - `search` should be a debounced string from the input.
 * - `type` controls which fields to search (province/amphoe/tambon/zip).
 * - `provinceId` / `amphoeId` can be provided to narrow the results by ID.
 */
export function useLocationSuggestion(search: string, options: Options = {}) {
  const { type = "tambon", provinceId, amphoeId, tambonId, limit = 100 } = options;

  // For dropdown lists (province, amphoe, tambon), always enabled
  // For postal code suggestions, also always enabled to show results immediately
  const enabled = true;

  return useQuery({
    queryKey: ["locationSuggestion", type, search, provinceId, amphoeId, tambonId, limit],
    queryFn: async () => {
      const searchTerm = search.trim();

      try {
        if (type === "province") {
          // Query provinces table directly for better performance
          let query = supabase.from("provinces").select("id, name_th, name_en");

          // Apply search filter only if search term exists
          if (searchTerm) {
            query = query.or(`name_th.ilike.%${searchTerm}%,name_en.ilike.%${searchTerm}%`);
          }

          const { data, error } = await query.limit(limit);

          if (error) throw error;

          // Map to LocationResult format
          return (
            data?.map((p) => ({
              province_id: p.id,
              province_name_th: p.name_th,
              province_name_en: p.name_en,
            })) ?? []
          );
        }

        // For amphoe, tambon, zip: use zip_code_view
        let query = supabase.from("zip_code_view").select("*");

        // Apply filters by ID
        if (provinceId) {
          query = query.eq("province_id", provinceId);
        }
        if (amphoeId) {
          query = query.eq("amphoe_id", amphoeId);
        }
        if (tambonId) {
          query = query.eq("tambon_id", tambonId);
        }

        // Apply search filters only if search term exists
        if (searchTerm) {
          if (type === "amphoe") {
            query = query.or(`amphoe_name_th.ilike.%${searchTerm}%,amphoe_name_en.ilike.%${searchTerm}%`);
          } else if (type === "tambon") {
            query = query.or(`tambon_name_th.ilike.%${searchTerm}%,tambon_name_en.ilike.%${searchTerm}%`);
          }
          if (type === "zip") {
            query = query.ilike("zip_code", `${searchTerm}%`);
          }
        }

        const { data, error } = await query.limit(limit);

        if (error) throw error;

        // Remove duplicates based on the type
        if (type === "amphoe" && data) {
          const seen = new Set<number>();
          return data.filter((item) => {
            if (item.amphoe_id && !seen.has(item.amphoe_id)) {
              seen.add(item.amphoe_id);
              return true;
            }
            return false;
          });
        }

        if (type === "tambon" && data) {
          const seen = new Set<number>();
          return data.filter((item) => {
            if (item.tambon_id && !seen.has(item.tambon_id)) {
              seen.add(item.tambon_id);
              return true;
            }
            return false;
          });
        }

        return data ?? [];
      } catch (err) {
        console.error("useLocationSuggestion error:", err);
        return [];
      }
    },
    enabled,
  });
}

export default useLocationSuggestion;
