"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input, Label, Button, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui";
import AddressForm from "@/components/(delivery)/AddressForm";
// type ComboboxOption removed (not used here)
import { useDebounce } from "use-debounce";
import useLocationSuggestion from "@/hooks/useLocationSuggestion";
import useDeliveryData from "@/hooks/useDeliveryData";
import { supabase } from "@/lib/supabase";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { User, Loader2, CheckCircle2, AlertCircle, ArrowLeft, Package, Clock, MapPinned } from "lucide-react";
import { FaMapMarkedAlt } from "react-icons/fa";
import axios from "axios";
import { useLiff } from "../providers/LiffProvider";
import SlipSection from "./SlipSection";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import liff from "@line/liff";
import useZipLocation from "../../hooks/useZipLocation";
import { Home, Store } from "lucide-react";

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
  status: "pending";
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
  status: "pending",
};

// --- Component ---
const DeliveryPage: React.FC = () => {
  const [formData, setFormData] = useState<IDeliveryForm>(initialFormState);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [locationType, setLocationType] = useState<"home" | "store">("home");
  const [queryClient] = useState(() => new QueryClient());
  const [provinceId, setProvinceId] = useState<number | undefined>();
  const [amphoeId, setAmphoeId] = useState<number | undefined>();
  const [tambonId, setTambonId] = useState<number | undefined>();
  const [zipSearch, setZipSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentPage, setCurrentPage] = useState<1 | 2>(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { lineUserId } = useLiff();
  const router = useRouter();

  // ตรวจสอบว่า user เคยกรอกข้อมูลแล้วหรือยัง
  const { data: existingData, isLoading: isCheckingData } = useDeliveryData(lineUserId);

  // ถ้ามีข้อมูลแล้ว redirect ไปหน้า confirm
  useEffect(() => {
    if (existingData) {
      router.push("/confirm");
    }
  }, [existingData, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Reset dependent fields when province/district changes
    if (name === "province") {
      setFormData((prev) => ({
        ...prev,
        district: "",
        subDistrict: "",
        postalCode: "",
      }));
      setAmphoeId(undefined);
      setTambonId(undefined);
    }
    if (name === "district") {
      setFormData((prev) => ({
        ...prev,
        subDistrict: "",
        postalCode: "",
      }));
      setTambonId(undefined);
    }
  };

  const handleNextPage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Validate page 1 fields
    const form = e.currentTarget;
    if (form.checkValidity()) {
      // ถ้าเลือกรับเองที่หน้าร้าน ให้แสดง modal ยืนยัน
      if (locationType === "store") {
        setShowConfirmModal(true);
      } else {
        // ถ้าส่งถึงบ้าน ให้ไปหน้า 2 เพื่ออัปโหลดสลิป
        setCurrentPage(2);
      }
    }
  };

  const handleConfirmStorePickup = async () => {
    setShowConfirmModal(false);
    await submitForm();
  };

  const submitForm = async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage("");

    try {
      // สร้าง FormData สำหรับส่ง multipart
      const formDataToSend = new FormData();

      // เพิ่มไฟล์ (ถ้ามี) - เฉพาะกรณีส่งถึงบ้าน
      if (attachment && locationType === "home") {
        formDataToSend.append("file", attachment);
      }

      // สร้าง payload ขึ้นอยู่กับวิธีรับ (locationType)
      let dataToSend: Partial<IDeliveryForm> & { locationType: string; line_user_id: string };
      if (locationType === "store") {
        // ส่งแบบรับที่หน้าร้าน: ส่งเฉพาะข้อมูลส่วนตัว ไม่ต้องส่งฟิลด์ที่อยู่
        // Omit address-related fields by destructuring into underscore-prefixed vars
        const { addressDetails, subDistrict, district, province, postalCode, ...rest } = formData as IDeliveryForm;
        // mark the removed fields as used to avoid unused-variable lint errors
        void addressDetails;
        void subDistrict;
        void district;
        void province;
        void postalCode;

        dataToSend = {
          ...rest,
          locationType: "store",
          line_user_id: lineUserId ?? "",
        };
      } else {
        // ส่งแบบส่งถึงบ้าน: ส่งทุกฟิลด์ที่อยู่ตามเดิม
        dataToSend = {
          ...formData,
          locationType: "home",
          line_user_id: lineUserId ?? "",
        };
      }

      // เพิ่มข้อมูลฟอร์มเป็น JSON string
      formDataToSend.append("data", JSON.stringify(dataToSend));

      console.log("✅ FormData to send data field: ", dataToSend);

      // ส่ง request ไปยัง API (อย่าเซ็ต Content-Type ให้ axios/เบราว์เซอร์จัดการ boundary ให้)
      const response = await axios.post("/api/delivery", formDataToSend);
      const trackingId = response.data?.trackingId || "N/A";

      // แสดง success dialog
      setIsSuccess(true);

      // ส่ง LINE Flex Message ทันทีหลังจากบันทึกสำเร็จ
      try {
        // สร้าง location/address box ตาม locationType
        const locationBox =
          dataToSend.locationType === "home"
            ? {
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
                    text: `${dataToSend.addressDetails || ""}, ${dataToSend.subDistrict || ""}, ${
                      dataToSend.district || ""
                    }, ${dataToSend.province || ""} ${dataToSend.postalCode || ""}`.trim(),
                    wrap: true,
                    color: "#666666",
                    size: "sm" as const,
                    flex: 5,
                  },
                ],
              }
            : {
                type: "box" as const,
                layout: "baseline" as const,
                contents: [
                  {
                    type: "text" as const,
                    text: "รับที่:",
                    color: "#aaaaaa",
                    size: "sm" as const,
                    flex: 1,
                  },
                  {
                    type: "text" as const,
                    text: "ร้าน OK Mobile (15 ธ.ค. 68 เป็นต้นไป)",
                    wrap: true,
                    color: "#666666",
                    size: "sm" as const,
                    flex: 5,
                  },
                ],
              };

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
                          text: "รหัส:",
                          color: "#aaaaaa",
                          size: "sm" as const,
                          flex: 1,
                        },
                        {
                          type: "text" as const,
                          text: trackingId,
                          wrap: true,
                          color: "#1e40af",
                          size: "sm" as const,
                          flex: 5,
                          weight: "bold" as const,
                        },
                      ],
                    },
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
                          text: dataToSend.customerName || "",
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
                          text: dataToSend.phone || "",
                          wrap: true,
                          color: "#666666",
                          size: "sm" as const,
                          flex: 5,
                        },
                      ],
                    },
                    locationBox,
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submitForm();
  };

  // --- File input handler ---
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke object URL when component unmounts or when preview changes
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Debounced search value for zip search
  const [debouncedZipSearch] = useDebounce(zipSearch, 400);

  // Fetch all provinces for dropdown
  const provinceQ = useLocationSuggestion("", { type: "province", limit: 300 });

  // Fetch amphoes based on selected province
  const districtQ = useLocationSuggestion("", {
    type: "amphoe",
    provinceId,
    limit: 300,
  });

  // Fetch tambons based on selected province and amphoe
  const tambonQ = useLocationSuggestion("", {
    type: "tambon",
    provinceId,
    amphoeId,
    limit: 300,
  });

  // Query for postal code suggestions with filters
  // ใช้ debouncedZipSearch เพื่อ filter ตามที่พิมพ์
  // และ filter ตาม province/amphoe/tambon ที่เลือกไว้
  const zipQ = useZipLocation(debouncedZipSearch, {
    limit: 100,
  });

  // Auto-fill รหัสไปรษณีย์เมื่อเลือกจังหวัด อำเภอ และตำบลครบ
  useEffect(() => {
    if (provinceId && amphoeId && tambonId && !formData.postalCode) {
      // Query เพื่อหารหัสไปรษณีย์ของตำบลที่เลือก
      const autoFillZip = async () => {
        try {
          const { data } = await supabase
            .from("zip_code_view")
            .select("*")
            .eq("province_id", provinceId)
            .eq("amphoe_id", amphoeId)
            .eq("tambon_id", tambonId)
            .limit(1);

          if (data && data.length > 0) {
            const zipCode = data[0].zip_code;
            if (zipCode) {
              setFormData((prev) => ({
                ...prev,
                postalCode: zipCode,
              }));
            }
          }
        } catch (error) {
          console.error("Error auto-filling postal code:", error);
        }
      };

      autoFillZip();
    }
  }, [provinceId, amphoeId, tambonId, formData.postalCode]);

  // (UI styling is provided by shadcn-style components in `components/ui`)

  // --- 5. JSX Render ---

  // แสดง loading ระหว่างตรวจสอบข้อมูล
  if (isCheckingData) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <p className="text-gray-600">กำลังตรวจสอบข้อมูล...</p>
          </div>
        </div>
      </QueryClientProvider>
    );
  }

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

      {/* Confirm Store Pickup Dialog */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md ">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-blue-600">
              <Store className="w-6 h-6" />
              ยืนยันการรับกล่องสินค้าเองที่หน้าร้าน
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex flex-col space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <MapPinned className="w-5 h-5 text-blue-600 mt-1 shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">สถานที่รับสินค้า</h4>
                    <p className="text-sm text-gray-700">
                      <strong>ร้าน OK Mobile ห้าง Center One</strong>
                      <br />
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-orange-600 mt-1 shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">วันที่สามารถรับได้</h4>
                    <p className="text-sm text-gray-700">
                      <strong>ตั้งแต่วันที่ 15 ธันวาคม 2568 เป็นต้นไป</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowConfirmModal(false)}
              className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
              disabled={isLoading}
            >
              ยกเลิก
            </Button>
            <Button onClick={handleConfirmStorePickup} className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                "ยืนยัน"
              )}
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
                              <b>
                                <u>ตั้งแต่วันที่ 1 พฤศจิกายน - 12 ธันวาคม 2568</u>
                              </b>
                            </p>

                            <p className="leading-relaxed">
                              ทางร้านจะเริ่มดำเนินการจัดส่งสินค้าในวันที่{" "}
                              <span className="font-semibold text-orange-900">15 ธันวาคม 2568 เป็นต้นไป</span>
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

                  <section>
                    <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2 flex items-center gap-3">
                      <Package className="w-6 h-6 text-blue-600" />
                      การรับสินค้า
                    </h2>
                    <div className="flex gap-4 text-sm">
                      <Button
                        type="button"
                        onClick={() => setLocationType("home")}
                        className={`flex flex-col justify-center items-center gap-2 py-2 rounded-lg transition-colors duration-300 ${
                          locationType === "home"
                            ? "bg-blue-500 text-white hover:bg-blue-600"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        <Home className={`w-8 h-8 text-white`} />
                        ส่งไปยังที่อยู่
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setLocationType("store")}
                        className={`flex flex-col justify-center items-center gap-2 py-2 rounded-lg transition-colors duration-300 ${
                          locationType === "store"
                            ? "bg-blue-500 text-white hover:bg-blue-600"
                            : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                        }`}
                      >
                        <Store className={`w-8 h-8 text-white`} />
                        รับกล่องเองที่หน้าร้าน
                      </Button>
                    </div>
                    <div className="mt-3 text-base text-gray-600">
                      {locationType === "home" && (
                        <div className="flex items-center justify-center mt-8 p-2 border border-orange-500 rounded-lg gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-orange-500 " />
                          <span className="text-orange-500">โอนค่าจัดส่ง 100 บาทและแนบสลิปในหน้าถัดไป</span>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* ========== Section 2: ข้อมูลที่อยู่ ========== */}
                  <section>
                    {locationType === "home" && (
                      <AddressForm
                        formData={formData}
                        handleChange={handleChange}
                        zipQ={zipQ}
                        provinceQ={provinceQ}
                        districtQ={districtQ}
                        tambonQ={tambonQ}
                        setFormData={setFormData}
                        provinceId={provinceId}
                        setProvinceId={setProvinceId}
                        amphoeId={amphoeId}
                        setAmphoeId={setAmphoeId}
                        setTambonId={setTambonId}
                        setZipSearch={setZipSearch}
                      />
                    )}

                    {locationType === "store" && (
                      <div className="relative bg-white border border-indigo-200 rounded-2xl shadow-lg overflow-hidden">
                        {/* Gradient Background Overlay */}
                        <div className="absolute inset-0 bg-linear-to-br from-indigo-50 via-blue-50 to-indigo-100 opacity-60"></div>

                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400 rounded-full blur-2xl opacity-20 -ml-12 -mb-12"></div>

                        <div className="relative p-6">
                          <div className="flex items-start gap-5">
                            {/* Content Section */}
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-3 flex-wrap">
                                {/* Icon Section */}
                                <div className="shrink-0">
                                  <div className="relative">
                                    <div className="w-16 h-16 bg-linear-to-br from-indigo-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-6 transition-transform">
                                      <MapPinned className="w-8 h-8 text-white animate-pulse" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full animate-ping opacity-75"></div>
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full"></div>
                                  </div>
                                </div>
                                <div>
                                  <h3 className="text-2xl font-bold text-gray-900">ร้าน OK Mobile </h3>
                                </div>
                              </div>

                              <div className="space-y-2.5">
                                <a
                                  href="https://www.google.com/maps/place/OK+Mobile+Shop+%E0%B8%AA%E0%B8%B2%E0%B8%82%E0%B8%B2+%E0%B8%AB%E0%B9%89%E0%B8%B2%E0%B8%87%E0%B9%80%E0%B8%8B%E0%B9%87%E0%B8%99%E0%B9%80%E0%B8%95%E0%B8%AD%E0%B8%A3%E0%B9%8C%E0%B8%A7%E0%B8%B1%E0%B8%99/@13.7639334,100.5391967,21z/data=!4m6!3m5!1s0x30e29fcf8d4ea5a5:0x23cc79f7dccc9f87!8m2!3d13.7638505!4d100.5393062!16s%2Fg%2F11gy9m3fcg?entry=ttu&g_ep=EgoyMDI1MTAyOS4yIKXMDSoASAFQAw%3D%3D"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <div className="flex justify-center items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border-2 border-indigo-200/50">
                                    <div>
                                      <p className="text-base text-black font-bold ">กดที่นี่เพื่อเปิด Google Map</p>
                                    </div>
                                    <div className=" p-1 border bg-gray-100 rounded-lg flex items-center justify-center">
                                      <FaMapMarkedAlt className="w-8 h-8 text-red-600" />
                                    </div>
                                  </div>
                                  <p className="text-center mt-4">มารับได้ตั้งแต่วันที่ 15 ธันวาคมเป็นต้นไป</p>
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* ========== Next Button ========== */}
                  <div>
                    <Button type="submit" disabled={isLoading} className="w-full">
                      {locationType === "store" ? "ยืนยันการลงทะเบียน" : "ถัดไป"}
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
