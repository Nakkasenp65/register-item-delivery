"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLiff } from "@/components/providers/LiffProvider";
import useDeliveryData from "@/hooks/useDeliveryData";
import { Loader2, Package, User, MapPin, Phone, Calendar, Image as ImageIcon, Send } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import liff from "@line/liff";

const ConfirmPageContent: React.FC = () => {
  const { lineUserId } = useLiff();
  const { data, isLoading, isError, error } = useDeliveryData(lineUserId);
  const [isSending, setIsSending] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Package className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">ไม่พบข้อมูล</h2>
            <p className="text-gray-600 text-center">
              {error instanceof Error ? error.message : "ไม่พบข้อมูลการจัดส่งของคุณในระบบ"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <Package className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">ไม่พบข้อมูล</h2>
            <p className="text-gray-600 text-center">ยังไม่มีข้อมูลการจัดส่งของคุณในระบบ</p>
          </div>
        </div>
      </div>
    );
  }

  // แสดงข้อมูลล่าสุด (first item)
  const delivery = data.data[0];

  const sendFlexMessage = async () => {
    setIsSending(true);
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
                        text: delivery.customerName,
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
                        text: delivery.phone,
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
                        text: `${delivery.addressDetails}, ${delivery.subDistrict}, ${delivery.district}, ${delivery.province} ${delivery.postalCode}`,
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
                        text: new Date(delivery.createdAt).toLocaleDateString("th-TH"),
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
        },
      };
      await liff.sendMessages([flexMessage]);
      alert("ส่งข้อมูลไปยังแชทเรียบร้อยแล้ว");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("เกิดข้อผิดพลาดในการส่งข้อมูล");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white sm:py-10 ">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto"
      >
        <div className="bg-white overflow-hidden sm:shadow-lg sm:rounded-lg">
          {/* Header */}
          <div className=" bg-linear-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-8 h-8" />
              <h1 className="text-2xl font-bold">ข้อมูลการจัดส่ง</h1>
            </div>
            <p className="text-blue-100 text-sm">รายละเอียดข้อมูลการจัดส่งของคุณ</p>
          </div>

          <div className="p-6 space-y-6">
            {/* แจ้งเตือนการจัดส่ง */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-linear-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 rounded-lg p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-orange-900 mb-2">📦 แจ้งเตือนสำคัญ - ส่งคืนกล่องสินค้า</h3>
                  <div className="text-orange-800 space-y-2">
                    <p className="leading-relaxed">
                      เนื่องจากร้านค้าปิดทำการชั่วคราว{" "}
                      <span className="font-semibold">ตั้งแต่วันที่ 1 - 12 พฤศจิกายน 2568</span>
                    </p>
                    <p className="leading-relaxed">
                      ทางร้านจะเริ่มดำเนินการจัดส่งสินค้าในวันที่{" "}
                      <span className="font-semibold text-orange-900">15 พฤศจิกายน 2568 เป็นต้นไป</span>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ข้อมูลส่วนตัว */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                <User className="w-5 h-5 text-blue-600" />
                ข้อมูลส่วนตัว
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">ชื่อ-นามสกุล</p>
                  <p className="text-gray-800 font-medium">{delivery.customerName}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    เบอร์ติดต่อ
                  </p>
                  <p className="text-gray-800 font-medium">{delivery.phone}</p>
                </div>
              </div>
            </section>

            {/* ข้อมูลที่อยู่ */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                <MapPin className="w-5 h-5 text-green-600" />
                ข้อมูลที่อยู่
              </h2>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">รายละเอียดที่อยู่</p>
                  <p className="text-gray-800">{delivery.addressDetails}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">ตำบล/แขวง</p>
                    <p className="text-sm text-gray-800 font-medium">{delivery.subDistrict}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">อำเภอ/เขต</p>
                    <p className="text-sm text-gray-800 font-medium">{delivery.district}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">จังหวัด</p>
                    <p className="text-sm text-gray-800 font-medium">{delivery.province}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">รหัสไปรษณีย์</p>
                    <p className="text-sm text-gray-800 font-medium">{delivery.postalCode}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* สลิปโอนเงิน */}
            {delivery.slipImageUrl && (
              <section>
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  <ImageIcon className="w-5 h-5 text-purple-600" />
                  สลิปโอนเงิน
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="relative inline-block">
                    <Image
                      src={delivery.slipImageUrl}
                      alt="สลิปโอนเงิน"
                      width={300}
                      height={400}
                      className="rounded-lg shadow-md object-cover"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* วันที่บันทึก */}
            <section>
              <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">วันที่บันทึกข้อมูล</p>
                  <p className="text-gray-800 font-medium">
                    {new Date(delivery.createdAt).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </section>

            {/* ID อ้างอิง */}
            <section>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">รหัสอ้างอิง</p>
                <p className="text-sm text-gray-600 font-mono break-all">{delivery._id}</p>
              </div>
            </section>

            {/* ปุ่มส่งข้อมูลไปยังแชท */}
            <section>
              <button
                onClick={sendFlexMessage}
                disabled={isSending}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                <span>{isSending ? "กำลังส่ง..." : "ส่งข้อมูลไปยังแชท"}</span>
              </button>
            </section>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function ConfirmPage() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ConfirmPageContent />
    </QueryClientProvider>
  );
}
