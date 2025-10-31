"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input, Textarea, Label, Button, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui";
import { useDebounce } from "use-debounce";
import useLocationSuggestion from "@/hooks/useLocationSuggestion";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { User, MapPin, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import axios from "axios";
import { useLiff } from "../providers/LiffProvider";
import SlipSection from "./SlipSection";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import liff from "@line/liff";

// --- 1. Interface สำหรับ state ของฟอร์ม ---
interface IDeliveryForm {
  customerName: string;
  line_user_id: string;
  phone: string;
  addressDetails: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
}

// --- 2. State เริ่มต้น ---
const initialFormState: IDeliveryForm = {
  customerName: "",
  line_user_id: "",
  phone: "",
  addressDetails: "",
  subDistrict: "",
  district: "",
  province: "",
  postalCode: "",
};

// --- Component ---
const DeliveryPage: React.FC = () => {
  const [formData, setFormData] = useState<IDeliveryForm>(initialFormState);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [queryClient] = useState(() => new QueryClient());
  const [provinceId, setProvinceId] = useState<number | undefined>();
  const [amphoeId, setAmphoeId] = useState<number | undefined>();
  const [showZipSuggestions, setShowZipSuggestions] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentPage, setCurrentPage] = useState<1 | 2>(1);
  const { lineUserId } = useLiff();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Re-enable suggestions when user types postal code
    if (name === "postalCode") setShowZipSuggestions(true);

    // Reset dependent fields when province/district changes
    if (name === "province") {
      setFormData((prev) => ({
        ...prev,
        district: "",
        subDistrict: "",
        postalCode: "",
      }));
      setAmphoeId(undefined);
    }
    if (name === "district") {
      setFormData((prev) => ({
        ...prev,
        subDistrict: "",
        postalCode: "",
      }));
    }
  };

  const handleNextPage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Validate page 1 fields
    const form = e.currentTarget;
    if (form.checkValidity()) {
      setCurrentPage(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setIsError(false);
    setErrorMessage("");

    try {
      // สร้าง FormData สำหรับส่ง multipart
      const formDataToSend = new FormData();

      // เพิ่มไฟล์ (ถ้ามี)
      if (attachment) {
        formDataToSend.append("file", attachment);
      }

      // เพิ่ม line_user_id ก่อนส่ง
      const dataToSend = {
        ...formData,
        line_user_id: lineUserId ?? "",
      };

      // เพิ่มข้อมูลฟอร์มเป็น JSON string
      formDataToSend.append("data", JSON.stringify(dataToSend));

      // ส่ง request ไปยัง API
      await axios.post("/api/delivery", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // แสดง success dialog
      setIsSuccess(true);

      // ส่ง LINE Flex Message ทันทีหลังจากบันทึกสำเร็จ
      try {
        const flexMessage = {
          type: "flex" as const,
          altText: "ข้อมูลการจัดส่ง",
          contents: {
            type: "bubble" as const,
            body: {
              type: "box" as const,
              layout: "vertical" as const,
              contents: [
                {
                  type: "text" as const,
                  text: "📦 ข้อมูลการจัดส่ง",
                  weight: "bold" as const,
                  size: "lg" as const,
                  color: "#1e40af",
                },
                {
                  type: "box" as const,
                  layout: "vertical" as const,
                  margin: "md" as const,
                  spacing: "sm" as const,
                  contents: [
                    {
                      type: "box" as const,
                      layout: "baseline" as const,
                      contents: [
                        {
                          type: "text" as const,
                          text: "ชื่อ:",
                          color: "#aaaaaa",
                          size: "sm" as const,
                          flex: 1,
                        },
                        {
                          type: "text" as const,
                          text: dataToSend.customerName,
                          wrap: true,
                          color: "#666666",
                          size: "sm" as const,
                          flex: 5,
                        },
                      ],
                    },
                    {
                      type: "box" as const,
                      layout: "baseline" as const,
                      contents: [
                        {
                          type: "text" as const,
                          text: "เบอร์:",
                          color: "#aaaaaa",
                          size: "sm" as const,
                          flex: 1,
                        },
                        {
                          type: "text" as const,
                          text: dataToSend.phone,
                          wrap: true,
                          color: "#666666",
                          size: "sm" as const,
                          flex: 5,
                        },
                      ],
                    },
                    {
                      type: "box" as const,
                      layout: "baseline" as const,
                      contents: [
                        {
                          type: "text" as const,
                          text: "ที่อยู่:",
                          color: "#aaaaaa",
                          size: "sm" as const,
                          flex: 1,
                        },
                        {
                          type: "text" as const,
                          text: `${dataToSend.addressDetails}, ${dataToSend.subDistrict}, ${dataToSend.district}, ${dataToSend.province} ${dataToSend.postalCode}`,
                          wrap: true,
                          color: "#666666",
                          size: "sm" as const,
                          flex: 5,
                        },
                      ],
                    },
                    {
                      type: "box" as const,
                      layout: "baseline" as const,
                      contents: [
                        {
                          type: "text" as const,
                          text: "วันที่:",
                          color: "#aaaaaa",
                          size: "sm" as const,
                          flex: 1,
                        },
                        {
                          type: "text" as const,
                          text: new Date().toLocaleDateString("th-TH"),
                          wrap: true,
                          color: "#666666",
                          size: "sm" as const,
                          flex: 5,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            footer: {
              type: "box" as const,
              layout: "vertical" as const,
              spacing: "sm" as const,
              contents: [
                {
                  type: "button" as const,
                  style: "primary" as const,
                  height: "sm" as const,
                  action: {
                    type: "uri" as const,
                    label: "ดูข้อมูลการจัดส่ง",
                    uri: "https://liff.line.me/2007338329-1LxVpq5O/confirm",
                  },
                },
              ],
            },
          },
        };

        await liff.sendMessages([flexMessage]);

        // ปิดหน้า LIFF หลังส่ง message สำเร็จ
        setTimeout(() => {
          liff.closeWindow();
        }, 1500);
      } catch (messageError) {
        console.error("Error sending LINE message:", messageError);
        // แม้ส่ง message ไม่สำเร็จ ก็ยังปิดหน้าได้
        setTimeout(() => {
          liff.closeWindow();
        }, 2000);
      }
    } catch (error) {
      console.error("Error submitting form:", error);

      let errorMsg = "เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง";

      if (axios.isAxiosError(error)) {
        errorMsg = error.response?.data?.error || error.message || errorMsg;
      }

      setErrorMessage(errorMsg);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // --- File input handler ---
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke object URL when component unmounts or when preview changes
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Debounced search value for postal code only
  const [debZip] = useDebounce(formData.postalCode, 300);

  // Fetch all provinces for dropdown
  const provinceQ = useLocationSuggestion("", { type: "province", limit: 100 });

  // Fetch amphoes based on selected province
  const districtQ = useLocationSuggestion("", {
    type: "amphoe",
    provinceId,
    limit: 100,
  });

  // Fetch tambons based on selected province and amphoe
  const tambonQ = useLocationSuggestion("", {
    type: "tambon",
    provinceId,
    amphoeId,
    limit: 200,
  });

  // Query for postal code suggestions only
  const zipQ = useLocationSuggestion(debZip, {
    type: "zip",
    provinceId,
    amphoeId,
    limit: 20,
  });

  // (UI styling is provided by shadcn-style components in `components/ui`)

  // --- 5. JSX Render ---
  return (
    <QueryClientProvider client={queryClient}>
      {/* Loading Dialog */}
      <Dialog open={isLoading}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-blue-600">
              <Loader2 className="w-6 h-6 animate-spin" />
              กำลังดำเนินการ...
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="flex flex-col items-center space-y-3">
              <div className="text-lg">กำลังบันทึกข้อมูลการจัดส่ง</div>
              <div className="text-sm text-gray-500">โปรดรอสักครู่ ระบบกำลังประมวลผลข้อมูลของคุณ</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={isSuccess} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-green-600">
              <CheckCircle2 className="w-6 h-6" />
              บันทึกข้อมูลสำเร็จ!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <div className="text-lg font-medium text-gray-800">ระบบได้บันทึกข้อมูลเรียบร้อยแล้ว</div>
              <div className="text-sm text-gray-500">กำลังนำคุณไปยังหน้าตรวจสอบข้อมูล...</div>
            </div>
          </div>
          <div className="flex justify-center mt-4">
            <Button onClick={() => router.push("/confirm")} className="w-full">
              ดูข้อมูลการจัดส่ง
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={isError} onOpenChange={setIsError}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-6 h-6" />
              เกิดข้อผิดพลาด
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <div className="text-lg font-medium text-gray-800">ไม่สามารถบันทึกข้อมูลได้</div>
              <div className="text-sm text-gray-600 px-4">{errorMessage}</div>
            </div>
          </div>
          <div className="flex justify-center mt-4">
            <Button onClick={() => setIsError(false)} className="w-full bg-red-600 hover:bg-red-700">
              ลองอีกครั้ง
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-white min-h-screen py-10">
        <div className="max-w-3xl mx-auto p-6 md:p-8 bg-white ">
          {/* --- Main Heading --- */}
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">ข้อมูลการจัดส่ง</h1>

          <AnimatePresence mode="wait">
            {currentPage === 1 ? (
              <motion.div
                key="page1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleNextPage} className="space-y-8">
                  {/* ========== Section 1: ข้อมูลส่วนตัว ========== */}
                  <section>
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-linear-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 rounded-lg p-5 shadow-sm mb-8"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h3 className="text-md font-bold text-orange-900 mb-2">
                            📦 แจ้งเตือนสำคัญ - ส่งคืนกล่องสินค้า
                          </h3>
                          <div className="text-sm text-orange-800 space-y-2">
                            <p className="leading-relaxed">
                              ลงทะเบียนส่งคืนกล่องสินค้า เนื่องจากร้านค้ากำลังอยู่ในระหว่างการรีโนเวท{" "}
                            </p>

                            <span className="font-semibold mb-2">ตั้งแต่วันที่ 1 - 12 พฤศจิกายน 2568</span>

                            <p className="leading-relaxed">
                              ทางร้านจะเริ่มดำเนินการจัดส่งสินค้าในวันที่{" "}
                              <span className="font-semibold text-orange-900">15 พฤศจิกายน 2568 เป็นต้นไป</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2 flex items-center gap-3">
                      <User className="w-6 h-6 text-blue-600" />
                      ข้อมูลส่วนตัว
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* --- ชื่อ --- */}
                      <div>
                        <Label htmlFor="customerName">ชื่อ-นามสกุล</Label>
                        <Input
                          type="text"
                          id="customerName"
                          name="customerName"
                          value={formData.customerName}
                          onChange={handleChange}
                          autoComplete="non-complete-field"
                          disabled={isLoading}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone">เบอร์ติดต่อ</Label>
                        <Input
                          type="tel"
                          id="phone"
                          name="phone"
                          disabled={isLoading}
                          value={formData.phone}
                          onChange={handleChange}
                          onKeyDown={(e) => {
                            // Allow only numeric keys, backspace, delete, tab, escape, enter, and arrow keys
                            if (
                              !/[0-9]/.test(e.key) &&
                              ![
                                "Backspace",
                                "Delete",
                                "Tab",
                                "Escape",
                                "Enter",
                                "ArrowLeft",
                                "ArrowRight",
                                "ArrowUp",
                                "ArrowDown",
                              ].includes(e.key)
                            ) {
                              e.preventDefault();
                            }
                          }}
                          onInput={(e) => {
                            // Remove any non-numeric characters
                            const target = e.target as HTMLInputElement;
                            target.value = target.value.replace(/\D/g, "");
                          }}
                          autoComplete="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={10}
                          required
                        />
                      </div>
                    </div>
                  </section>

                  {/* ========== Section 2: ข้อมูลที่อยู่ ========== */}
                  <section>
                    <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2 flex items-center gap-3">
                      <MapPin className="w-6 h-6 text-green-600" />
                      ข้อมูลที่อยู่
                    </h2>
                    <div className="space-y-6">
                      {/* --- Grid สำหรับ ที่อยู่ส่วนย่อย --- */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* --- รหัสไปรษณีย์ --- */}
                        <div className="relative">
                          <Label htmlFor="postalCode">รหัสไปรษณีย์</Label>
                          <Input
                            type="text"
                            id="postalCode"
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleChange}
                            inputMode="numeric" // แสดงแป้นพิมพ์ตัวเลขบนมือถือ
                            pattern="\d{5}" // ตรวจสอบว่ามี 5 หลัก
                            maxLength={5}
                            required
                            autoComplete="non-complete-field"
                          />
                          {Array.isArray(zipQ.data) && debZip && zipQ.data.length > 0 && showZipSuggestions && (
                            <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                              {zipQ.data.map((r, idx: number) => {
                                const zip = r.zip_code ?? "";
                                const tambon = r.tambon_name_th ?? r.tambon_name_en ?? "";
                                const amphoe = r.amphoe_name_th ?? r.amphoe_name_en ?? "";
                                const province = r.province_name_th ?? r.province_name_en ?? "";
                                return (
                                  <li
                                    key={`z-${idx}-${r.zip_code}`}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                    onMouseDown={(ev) => ev.preventDefault()}
                                    onClick={() => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        postalCode: zip,
                                        subDistrict: tambon,
                                        district: amphoe,
                                        province: province,
                                      }));
                                      setProvinceId(r.province_id);
                                      setAmphoeId(r.amphoe_id);
                                      setShowZipSuggestions(false);
                                    }}
                                  >
                                    <div className="text-sm font-medium text-gray-800">{zip}</div>
                                    <div className="text-xs text-gray-500">
                                      {tambon} • {amphoe} • {province}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>

                        {/* --- จังหวัด --- */}
                        <div>
                          <Label htmlFor="province">จังหวัด</Label>
                          <select
                            id="province"
                            name="province"
                            value={formData.province}
                            onChange={(e) => {
                              handleChange(e);
                              const selectedProvince = provinceQ.data?.find(
                                (p) => (p.province_name_th ?? p.province_name_en) === e.target.value
                              );
                              if (selectedProvince) {
                                setProvinceId(selectedProvince.province_id);
                              }
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="">-- เลือกจังหวัด --</option>
                            {provinceQ.data?.map((p) => {
                              const label = p.province_name_th ?? p.province_name_en ?? "";
                              return (
                                <option key={p.province_id} value={label}>
                                  {label}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* --- อำเภอ/เขต --- */}
                        <div>
                          <Label htmlFor="district">อำเภอ/เขต</Label>
                          <select
                            id="district"
                            name="district"
                            value={formData.district}
                            onChange={(e) => {
                              handleChange(e);
                              const selectedDistrict = districtQ.data?.find(
                                (d) => (d.amphoe_name_th ?? d.amphoe_name_en) === e.target.value
                              );
                              if (selectedDistrict) {
                                setAmphoeId(selectedDistrict.amphoe_id);
                              }
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                            disabled={!provinceId}
                            required
                          >
                            <option value="">-- เลือกอำเภอ/เขต --</option>
                            {districtQ.data?.map((d) => {
                              const label = d.amphoe_name_th ?? d.amphoe_name_en ?? "";
                              return (
                                <option key={d.amphoe_id} value={label}>
                                  {label}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* --- ตำบล/แขวง --- */}
                        <div>
                          <Label htmlFor="subDistrict">ตำบล/แขวง</Label>
                          <select
                            id="subDistrict"
                            name="subDistrict"
                            value={formData.subDistrict}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                            disabled={!amphoeId}
                            required
                          >
                            <option value="">-- เลือกตำบล/แขวง --</option>
                            {tambonQ.data?.map((t) => {
                              const label = t.tambon_name_th ?? t.tambon_name_en ?? "";
                              return (
                                <option key={t.tambon_id} value={label}>
                                  {label}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                      {/* --- ที่อยู่ (รายละเอียด) --- */}
                      <div>
                        <Label htmlFor="addressDetails">รายละเอียดที่อยู่ (บ้านเลขที่, ถนน, หมู่บ้าน, ฯลฯ)</Label>
                        <Textarea
                          id="addressDetails"
                          name="addressDetails"
                          rows={3}
                          value={formData.addressDetails}
                          onChange={handleChange}
                          className="min-h-20 resize-y"
                          placeholder="เช่น 99/9 หมู่ 1 ถ.สุขุมวิท ซ. 101"
                          autoComplete="non-complete-field"
                          required
                        />
                      </div>
                    </div>
                  </section>

                  {/* ========== Next Button ========== */}
                  <div>
                    <Button type="submit" disabled={isLoading} className="w-full">
                      ถัดไป
                    </Button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="page2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Back Button */}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>กลับ</span>
                  </button>

                  <SlipSection
                    attachment={attachment}
                    setAttachment={setAttachment}
                    previewUrl={previewUrl}
                    setPreviewUrl={setPreviewUrl}
                    fileInputRef={fileInputRef}
                    isLoading={isLoading}
                  />

                  {/* ========== Submit Button ========== */}
                  <div>
                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          กำลังบันทึก...
                        </>
                      ) : (
                        "บันทึกข้อมูลการจัดส่ง"
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default DeliveryPage;
