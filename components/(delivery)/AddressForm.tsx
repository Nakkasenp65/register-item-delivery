import { MapPin } from "lucide-react";
import { Combobox, ComboboxOption, Label, Textarea } from "../ui";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface AddressFormProps {
  formData: {
    postalCode: string;
    province: string;
    district: string;
    subDistrict: string;
    addressDetails: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  zipQ: any;
  provinceQ: any;
  districtQ: any;
  tambonQ: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  provinceId: number | undefined;
  setProvinceId: React.Dispatch<React.SetStateAction<number | undefined>>;
  amphoeId: number | undefined;
  setAmphoeId: React.Dispatch<React.SetStateAction<number | undefined>>;
  setTambonId: React.Dispatch<React.SetStateAction<number | undefined>>;
  setZipSearch: React.Dispatch<React.SetStateAction<string>>;
}

export default function AddressForm({
  formData,
  handleChange,
  zipQ,
  provinceQ,
  districtQ,
  tambonQ,
  setFormData,
  provinceId,
  setProvinceId,
  amphoeId,
  setAmphoeId,
  setTambonId,
  setZipSearch,
}: AddressFormProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2 flex items-center gap-3">
        <MapPin className="w-6 h-6 text-green-600" />
        ข้อมูลที่อยู่
      </h2>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="postalCode">รหัสไปรษณีย์</Label>

            <Combobox
              options={(() => {
                const options =
                  zipQ.data?.map((r: any) => {
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

                if (formData.postalCode && !options.find((opt: any) => opt.value === formData.postalCode)) {
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
              onOptionSelect={(option: any) => {
                const selectedZip = option.data;
                if (selectedZip) {
                  setFormData((prev: any) => ({
                    ...prev,
                    postalCode: option.value,
                    subDistrict: selectedZip.tambon_name_th ?? selectedZip.tambon_name_en ?? "",
                    district: selectedZip.amphoe_name_th ?? selectedZip.amphoe_name_en ?? "",
                    province: selectedZip.province_name_th ?? selectedZip.province_name_en ?? "",
                  }));
                  setProvinceId(selectedZip.province_id);
                  setAmphoeId(selectedZip.amphoe_id);
                }
              }}
              onSearchChange={setZipSearch}
              placeholder="เลือกรหัสไปรษณีย์"
              searchPlaceholder="ค้นหารหัสไปรษณีย์..."
              emptyText="ลองพิมพ์เพื่อค้นหารหัสไปรษณีย์"
              disabled={false}
            />
          </div>

          <div>
            <Label htmlFor="province">จังหวัด</Label>
            <select
              id="province"
              name="province"
              value={formData.province}
              onChange={(e) => {
                handleChange(e);
                const selectedProvince = provinceQ.data?.find(
                  (p: any) => (p.province_name_th ?? p.province_name_en) === e.target.value
                );
                if (selectedProvince) {
                  setProvinceId(selectedProvince.province_id);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">-- เลือกจังหวัด --</option>
              {provinceQ.data?.map((p: any) => {
                const label = p.province_name_th ?? p.province_name_en ?? "";
                return (
                  <option key={p.province_id} value={label}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <Label htmlFor="district">อำเภอ/เขต</Label>
            <select
              id="district"
              name="district"
              value={formData.district}
              onChange={(e) => {
                handleChange(e);
                const selectedDistrict = districtQ.data?.find(
                  (d: any) => (d.amphoe_name_th ?? d.amphoe_name_en) === e.target.value
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
              {districtQ.data?.map((d: any) => {
                const label = d.amphoe_name_th ?? d.amphoe_name_en ?? "";
                return (
                  <option key={d.amphoe_id} value={label}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <Label htmlFor="subDistrict">ตำบล/แขวง</Label>
            <select
              id="subDistrict"
              name="subDistrict"
              value={formData.subDistrict}
              onChange={(e) => {
                handleChange(e);
                const selectedTambon = tambonQ.data?.find(
                  (t: any) => (t.tambon_name_th ?? t.tambon_name_en) === e.target.value
                );
                if (selectedTambon) {
                  setTambonId(selectedTambon.tambon_id);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100"
              disabled={!amphoeId}
              required
            >
              <option value="">-- เลือกตำบล/แขวง --</option>
              {tambonQ.data?.map((t: any) => {
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
  );
}
