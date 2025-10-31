import { createClient } from "@supabase/supabase-js";

// 1. ดึงค่า Environment Variables
// (สำหรับ Next.js ต้องใช้ NEXT_PUBLIC_...
//  สำหรับ React (CRA) ต้องใช้ REACT_APP_...)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 2. ตรวจสอบว่ามีค่าครบถ้วนหรือไม่
if (!supabaseUrl) {
  throw new Error("Supabase URL is missing. Check .env.local file (NEXT_PUBLIC_SUPABASE_URL).");
}
if (!supabaseAnonKey) {
  throw new Error("Supabase Anon Key is missing. Check .env.local file (NEXT_PUBLIC_SUPABASE_ANON_KEY).");
}

// 3. สร้างและ export client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
