"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Input, Textarea, Label, Button, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui";
import { useDebounce } from "use-debounce";
import useLocationSuggestion from "@/hooks/useLocationSuggestion";
import useDeliveryById from "@/hooks/useDeliveryById";
import { User, MapPin, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import axios from "axios";
import { motion } from "framer-motion";

interface IAddressForm {
  customerName: string;
  phone: string;
  addressDetails: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
}

const EditAddressContent: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const deliveryId = params.id as string;

  const { data: deliveryData, isLoading: isLoadingData, isError: isErrorData } = useDeliveryById(deliveryId);

  const [formData, setFormData] = useState<IAddressForm>({
    customerName: "",
    phone: "",
    addressDetails: "",
    subDistrict: "",
    district: "",
    province: "",
    postalCode: "",
  });

  const [provinceId, setProvinceId] = useState<number | undefined>();
  const [amphoeId, setAmphoeId] = useState<number | undefined>();
  const [showZipSuggestions, setShowZipSuggestions] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Populate form when data is loaded
  useEffect(() => {
    if (deliveryData?.data) {
      const delivery = deliveryData.data;
      setFormData({
        customerName: delivery.customerName,
        phone: delivery.phone,
        addressDetails: delivery.addressDetails,
        subDistrict: delivery.subDistrict,
        district: delivery.district,
        province: delivery.province,
        postalCode: delivery.postalCode,
      });
    }
  }, [deliveryData]);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setIsError(false);
    setErrorMessage("");

    try {
      await axios.put(`/api/delivery/${deliveryId}`, formData);

      setIsSuccess(true);

      // Redirect back to confirm page after 2 seconds
      setTimeout(() => {
        router.push("/confirm");
      }, 2000);
    } catch (error) {
      console.error("Error updating address:", error);

      let errorMsg = "เกิดข้อผิดพลาดในการอัปเดตข้อมูล กรุณาลองใหม่อีกครั้ง";

      if (axios.isAxiosError(error)) {
        errorMsg = error.response?.data?.error || error.message || errorMsg;
      }

      setErrorMessage(errorMsg);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (isErrorData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">ไม่พบข้อมูล</h2>
            <p className="text-gray-600 text-center">ไม่พบข้อมูลการจัดส่งที่ต้องการแก้ไข</p>
            <Button onClick={() => router.push("/confirm")} className="w-full">
              กลับหน้าหลัก
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen py-10">
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
              <div className="text-lg">กำลังอัปเดตข้อมูลที่อยู่</div>
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
              อัปเดตข้อมูลสำเร็จ!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <div className="text-lg font-medium text-gray-800">ระบบได้อัปเดตข้อมูลเรียบร้อยแล้ว</div>
              <div className="text-sm text-gray-500">กำลังนำคุณกลับไปยังหน้าหลัก...</div>
            </div>
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
              <div className="text-lg font-medium text-gray-800">ไม่สามารถอัปเดตข้อมูลได้</div>
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

      <div className="max-w-3xl mx-auto p-6 md:p-8 bg-white">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.push("/confirm")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>กลับ</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-800 text-center">แก้ไขข้อมูลที่อยู่</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* ========== Section 1: ข้อมูลส่วนตัว ========== */}
            <section>
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
                      inputMode="numeric"
                      pattern="\d{5}"
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

            {/* ========== Submit Button ========== */}
            <div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังอัปเดต...
                  </>
                ) : (
                  "อัปเดตข้อมูลที่อยู่"
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default function EditAddressPage() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <EditAddressContent />
    </QueryClientProvider>
  );
}
