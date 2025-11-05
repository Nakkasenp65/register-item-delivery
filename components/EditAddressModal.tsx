"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useLocationSuggestion from "@/hooks/useLocationSuggestion";
import useZipLocation from "@/hooks/useZipLocation";
import { supabase } from "@/lib/supabase";
import { useDebounce } from "use-debounce";
import { Dialog, DialogContent, DialogHeader, DialogTitle, Label, Textarea, Button, Combobox } from "@/components/ui";
import type { ComboboxOption } from "@/components/ui";
import { Loader2 } from "lucide-react";
import axios from "axios";

interface EditAddressModalProps {
  open: boolean;
  onClose: () => void;
  deliveryId: string;
  initialData: {
    postalCode: string;
    province: string;
    district: string;
    subDistrict: string;
    addressDetails: string;
  };
}

export function EditAddressModal({ open, onClose, deliveryId, initialData }: EditAddressModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(initialData);
  const [provinceId, setProvinceId] = useState<number | undefined>();
  const [amphoeId, setAmphoeId] = useState<number | undefined>();
  const [tambonId, setTambonId] = useState<number | undefined>();
  const [zipSearch, setZipSearch] = useState("");
  const [lastUpdatedBy, setLastUpdatedBy] = useState<"address" | "zip" | null>(null);

  const [debouncedZipSearch] = useDebounce(zipSearch, 300);

  // Fetch data
  const provinceQ = useLocationSuggestion("", { type: "province", limit: 300 });
  const districtQ = useLocationSuggestion("", { type: "amphoe", provinceId, limit: 300 });
  const tambonQ = useLocationSuggestion("", { type: "tambon", provinceId, amphoeId, limit: 300 });
  const zipQ = useZipLocation(debouncedZipSearch, { limit: 100 });

  // Initialize provinceId, amphoeId, tambonId from initialData when modal opens
  useEffect(() => {
    if (open && initialData.province && provinceQ.data) {
      const province = provinceQ.data.find((p) => (p.province_name_th ?? p.province_name_en) === initialData.province);
      if (province) {
        setProvinceId(province.province_id);
      }
    }
  }, [open, initialData.province, provinceQ.data]);

  useEffect(() => {
    if (open && initialData.district && provinceId && districtQ.data) {
      const district = districtQ.data.find((d) => (d.amphoe_name_th ?? d.amphoe_name_en) === initialData.district);
      if (district) {
        setAmphoeId(district.amphoe_id);
      }
    }
  }, [open, initialData.district, provinceId, districtQ.data]);

  useEffect(() => {
    if (open && initialData.subDistrict && amphoeId && tambonQ.data) {
      const tambon = tambonQ.data.find((t) => (t.tambon_name_th ?? t.tambon_name_en) === initialData.subDistrict);
      if (tambon) {
        setTambonId(tambon.tambon_id);
      }
    }
  }, [open, initialData.subDistrict, amphoeId, tambonQ.data]);

  // Mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await axios.put(`/api/delivery/${deliveryId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery"] });
      onClose();
    },
    onError: (error) => {
      console.error("Error updating address:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    },
  });

  // Auto-fill postal code
  useEffect(() => {
    if (provinceId && amphoeId && tambonId && lastUpdatedBy === "address") {
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
            if (zipCode && zipCode !== formData.postalCode) {
              setFormData((prev) => ({ ...prev, postalCode: zipCode }));
              setLastUpdatedBy(null);
            }
          }
        } catch (error) {
          console.error("Error auto-filling postal code:", error);
        }
      };
      autoFillZip();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinceId, amphoeId, tambonId, lastUpdatedBy]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "province") {
      setFormData((prev) => ({ ...prev, district: "", subDistrict: "", postalCode: "" }));
      setAmphoeId(undefined);
      setTambonId(undefined);
      setLastUpdatedBy(null);
    }
    if (name === "district") {
      setFormData((prev) => ({ ...prev, subDistrict: "", postalCode: "" }));
      setTambonId(undefined);
      setLastUpdatedBy(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>แก้ไขที่อยู่</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* รหัสไปรษณีย์ */}
            <div>
              <Label htmlFor="postalCode">รหัสไปรษณีย์</Label>
              <Combobox
                options={(() => {
                  const options =
                    zipQ.data?.map((r) => {
                      const zip = r.zip_code ?? "";
                      const tambon = r.tambon_name_th ?? r.tambon_name_en ?? "";
                      const amphoe = r.amphoe_name_th ?? r.amphoe_name_en ?? "";
                      const province = r.province_name_th ?? r.province_name_en ?? "";
                      return {
                        value: zip,
                        label: zip,
                        subLabel: `${tambon} • ${amphoe} • ${province}`,
                        data: r,
                      } as ComboboxOption;
                    }) ?? [];

                  if (formData.postalCode && !options.find((opt) => opt.value === formData.postalCode)) {
                    options.unshift({
                      value: formData.postalCode,
                      label: formData.postalCode,
                      subLabel: `${formData.subDistrict} • ${formData.district} • ${formData.province}`,
                      data: null,
                    });
                  }
                  return options;
                })()}
                value={formData.postalCode}
                onOptionSelect={(option) => {
                  setLastUpdatedBy("zip");
                  const selectedZip = option.data;
                  if (selectedZip) {
                    setFormData((prev) => ({
                      ...prev,
                      postalCode: option.value,
                      subDistrict: selectedZip.tambon_name_th ?? selectedZip.tambon_name_en ?? "",
                      district: selectedZip.amphoe_name_th ?? selectedZip.amphoe_name_en ?? "",
                      province: selectedZip.province_name_th ?? selectedZip.province_name_en ?? "",
                    }));
                    setProvinceId(selectedZip.province_id);
                    setAmphoeId(selectedZip.amphoe_id);
                    setTambonId(selectedZip.tambon_id);
                  }
                }}
                onSearchChange={setZipSearch}
                placeholder="เลือกรหัสไปรษณีย์"
                searchPlaceholder="ค้นหารหัสไปรษณีย์..."
                emptyText="ลองพิมพ์เพื่อค้นหารหัสไปรษณีย์"
              />
            </div>

            {/* จังหวัด */}
            <div>
              <Label htmlFor="province">จังหวัด</Label>
              <select
                id="province"
                name="province"
                value={formData.province}
                onChange={(e) => {
                  handleChange(e);
                  setLastUpdatedBy("address");
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

            {/* อำเภอ/เขต */}
            <div>
              <Label htmlFor="district">อำเภอ/เขต</Label>
              <select
                id="district"
                name="district"
                value={formData.district}
                onChange={(e) => {
                  handleChange(e);
                  setLastUpdatedBy("address");
                  const selectedDistrict = districtQ.data?.find(
                    (d) => (d.amphoe_name_th ?? d.amphoe_name_en) === e.target.value
                  );
                  if (selectedDistrict) {
                    setAmphoeId(selectedDistrict.amphoe_id);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
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

            {/* ตำบล/แขวง */}
            <div>
              <Label htmlFor="subDistrict">ตำบล/แขวง</Label>
              <select
                id="subDistrict"
                name="subDistrict"
                value={formData.subDistrict}
                onChange={(e) => {
                  handleChange(e);
                  setLastUpdatedBy("address");
                  const selectedTambon = tambonQ.data?.find(
                    (t) => (t.tambon_name_th ?? t.tambon_name_en) === e.target.value
                  );
                  if (selectedTambon) {
                    setTambonId(selectedTambon.tambon_id);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
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

          {/* รายละเอียดที่อยู่ */}
          <div>
            <Label htmlFor="addressDetails">รายละเอียดที่อยู่</Label>
            <Textarea
              id="addressDetails"
              name="addressDetails"
              value={formData.addressDetails}
              onChange={handleChange}
              rows={3}
              placeholder="เช่น 99/9 หมู่ 1 ถ.สุขุมวิท ซ. 101"
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex  justify-between gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="flex flex-1 items-center justify-center px-2 py-2   rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <Button
              type="submit"
              className="flex-2 flex items-center justify-center"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                "บันทึก"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
